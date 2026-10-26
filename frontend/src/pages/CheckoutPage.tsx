import { useState, useEffect, useRef } from "react";
import { useQuery } from '@tanstack/react-query';
import { useNavigate, Link } from "react-router";
import { motion } from "motion/react";
import { ImageWithFallback } from "../app/components/figma/ImageWithFallback";
import { useCart } from "../components/cart/CartContext";
import { HamsterLoader } from "../components/ui/HamsterLoader";
import { useAddresses } from "../lib/hooks/useAddresses";
import { toast } from "sonner";
import { orderService, type Order } from "../lib/services/orderService";
import { paymentService, paymentUrl } from '../lib/services/paymentService';
import {
  ArrowLeft,
  CreditCard,
  QrCode,
  MapPin,
  ShieldCheck,
  ChevronRight,
  Check,
  Package,
  Plus,
  AlertCircle,
  Info,
} from "lucide-react";
import { Button } from "../components/ui/button";

type Step = "address" | "payment" | "review";

const STEPS: { key: Step; label: string }[] = [
  { key: "address", label: "Endereço" },
  { key: "payment", label: "Pagamento" },
  { key: "review", label: "Revisão" },
];

// Utilitário de mapeamento de erros da API
type ApiErrorCode = 
  | 'INSUFFICIENT_STOCK' 
  | 'PAYMENT_FAILED' 
  | 'PAYMENT_DECLINED'
  | 'CART_EMPTY'
  | 'ADDRESS_REQUIRED'
  | 'SERVER_ERROR';

function getCheckoutErrorMessage(error: any): { 
  title: string; 
  description: string; 
  code?: string;
  metadata?: any; 
} {
  const apiError = error?.response?.data?.error || error?.data?.error || error;
  const errorCode = apiError?.code;

  switch (errorCode) {
    case 'INSUFFICIENT_STOCK':
      return {
        title: 'Estoque insuficiente',
        description: apiError.message || 'Um ou mais itens do seu carrinho esgotaram ou não têm a quantidade solicitada.',
        code: errorCode,
        metadata: apiError.metadata || apiError.details
      };
    
    case 'PAYMENT_DECLINED':
    case 'PAYMENT_FAILED':
      return {
        title: 'Falha no pagamento',
        description: 'Não foi possível processar o pagamento. Verifique seus dados ou tente outro método.',
        code: errorCode
      };

    case 'CART_EMPTY':
      return {
        title: 'Carrinho vazio',
        description: 'Seu carrinho está vazio. Adicione produtos antes de finalizar.',
        code: errorCode
      };

    default:
      return {
        title: 'Ops, algo deu errado',
        description: 'Não foi possível finalizar o pedido no momento. Tente novamente.',
        code: 'UNKNOWN'
      };
  }
}

/** Aviso do modo simulado (P5): a escolha Cartão/PIX é só um rótulo. */
function SimulatedPaymentNotice() {
  return (
    <div role="note" className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
      <Info className="h-4 w-4 mt-0.5 shrink-0" />
      <span>Pagamento simulado — nenhum valor real é cobrado.</span>
    </div>
  );
}

export function CheckoutPage() {
  const { items, totalPrice, totalItems, clearCart, isLoading: isLoadingCart } = useCart();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<Step>("address");
  const [isProcessing, setIsProcessing] = useState(false);
  const processing = useRef(false);
  const orderCreated = useRef(false);
  const paymentConfig = useQuery({ queryKey: ['payment-config'], queryFn: paymentService.configuration, staleTime: 30000 });
  const mercadoPagoEnabled = paymentConfig.data?.provider === 'MERCADO_PAGO';

  // Hook de endereços
  const { addresses, isLoading: isLoadingAddresses, error: addressError } = useAddresses();
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);

  // Seleciona automaticamente o endereço padrão
  useEffect(() => {
    if (addresses && addresses.length > 0 && !selectedAddressId) {
      const defaultAddress = addresses.find((addr) => addr.is_default) || addresses[0];
      setSelectedAddressId(defaultAddress.id);
    }
  }, [addresses, selectedAddressId]);

  const selectedAddress = addresses?.find((addr) => addr.id === selectedAddressId);

  // Payment — no modo simulado, Cartão/PIX é só um rótulo: nenhum dado de
  // pagamento é pedido nem enviado (P5).
  const [paymentMethod, setPaymentMethod] = useState<"credit" | "pix">("credit");

  // Total exibido = soma dos itens = valor cobrado pelo pedido (DEC-C): sem
  // frete, cupom ou desconto calculados só na tela.
  const totalLabel = `R$ ${totalPrice.toFixed(2).replace(".", ",")}`;

  const stepIndex = STEPS.findIndex((s) => s.key === currentStep);

  // Verifica carrinho vazio
  useEffect(() => {
    if (!isLoadingCart && items.length === 0 && !isProcessing && !orderCreated.current) {
      navigate('/cart', { replace: true });
    }
  }, [isLoadingCart, items.length, isProcessing, navigate]);

  const handleNextFromAddress = () => {
    if (!selectedAddressId) {
      toast.error("Por favor, selecione um endereço de entrega.");
      return;
    }
    setCurrentStep("payment");
  };

  const handleNextFromPayment = () => {
    setCurrentStep("review");
  };

  const handleFinalize = async () => {
    if (processing.current) return;
    processing.current = true;
    setIsProcessing(true);
    let createdOrders: Order[] = [];
    try {
      const config = await paymentService.configuration();
      const response = await orderService.createOrder({ address_id: selectedAddressId });
      const orders = response.orders?.length ? response.orders : [response.order];
      if (!orders.every((order) => order?.id)) throw new Error('Pedido não retornado pelo servidor.');
      createdOrders = orders;
      orderCreated.current = true;
      if (config.provider === 'MERCADO_PAGO') {
        navigate(paymentUrl(createdOrders.map((order) => order.id)));
        clearCart();
        return;
      }
      for (const order of createdOrders) await orderService.payOrder(order.id);
      navigate('/checkout/success', { state: { orderId: createdOrders[0].id, orderIds: createdOrders.map((order) => order.id) } });
      clearCart();
    } catch (error: any) {
      const parsedError = getCheckoutErrorMessage(error);
      
      // Tratamento completo de erros
      if (parsedError.code === 'INSUFFICIENT_STOCK') {
        toast.error(parsedError.title, {
          description: parsedError.description,
          duration: 8000,
          action: {
            label: 'Ir para o Carrinho',
            onClick: () => navigate('/cart'),
          },
        });
      } else if (parsedError.code === 'PAYMENT_FAILED' || parsedError.code === 'PAYMENT_DECLINED') {
        toast.error(parsedError.title, { description: parsedError.description });
        setCurrentStep('payment'); // Volta para o usuário tentar outro cartão
      } else {
        toast.error(parsedError.title, { description: parsedError.description });
      }

      if (createdOrders.length) {
        navigate(paymentUrl(createdOrders.map((order) => order.id)));
        clearCart();
      }
    } finally {
      setIsProcessing(false);
      processing.current = false;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 relative">
      {/* Header */}
      <div className="bg-white border-b border-slate-100">
        <div className="container mx-auto max-w-4xl px-4 py-4">
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => {
                if (currentStep === "address") navigate("/cart");
                else setCurrentStep(currentStep === "review" ? "payment" : "address");
              }}
              className="p-2 rounded-full hover:bg-slate-100 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-slate-600" />
            </button>
            <h1 className="text-lg font-bold text-slate-900 font-[family-name:var(--font-display)]">
              Checkout
            </h1>
          </div>

          {/* Steps */}
          <div className="flex items-center justify-between max-w-md mx-auto">
            {STEPS.map((step, i) => (
              <div key={step.key} className="flex items-center gap-2">
                <div
                  className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                    i < stepIndex
                      ? "bg-emerald-500 text-white"
                      : i === stepIndex
                      ? "bg-[var(--color-primary-500)] text-white"
                      : "bg-slate-100 text-slate-400"
                  }`}
                >
                  {i < stepIndex ? <Check className="h-4 w-4" /> : i + 1}
                </div>
                <span
                  className={`text-xs font-medium hidden sm:inline ${
                    i <= stepIndex ? "text-slate-900" : "text-slate-400"
                  }`}
                >
                  {step.label}
                </span>
                {i < STEPS.length - 1 && (
                  <div
                    className={`w-8 sm:w-16 h-0.5 mx-1 ${
                      i < stepIndex ? "bg-emerald-500" : "bg-slate-200"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-4xl px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* STEP 1: Address */}
            {currentStep === "address" && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-5"
              >
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-[var(--color-primary-500)]" />
                  <h2 className="font-bold text-slate-900 font-[family-name:var(--font-display)]">
                    Endereço de Entrega
                  </h2>
                </div>

                {isLoadingAddresses && (
                  <div className="flex flex-col items-center justify-center p-8 space-y-3">
                    <div className="h-8 w-8 border-4 border-[var(--color-primary-500)] border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm text-slate-500">Carregando seus endereços...</p>
                  </div>
                )}

                {addressError && (
                  <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-700">
                    <AlertCircle className="h-5 w-5 shrink-0" />
                    <p className="text-sm">Não foi possível carregar os endereços. Tente novamente mais tarde.</p>
                  </div>
                )}

                {!isLoadingAddresses && !addressError && addresses?.length === 0 && (
                  <div className="p-8 text-center border border-dashed border-slate-200 rounded-xl space-y-3">
                    <MapPin className="h-10 w-10 text-slate-300 mx-auto" />
                    <p className="text-sm text-slate-600">Você ainda não possui endereços cadastrados.</p>
                    <Button asChild variant="outline" className="gap-2">
                      <Link to="/tutor/perfil#meus-enderecos" onClick={() => sessionStorage.setItem("come_from_checkout", "true")}>
                        <Plus className="h-4 w-4" />
                          Cadastrar Novo Endereço
                      </Link>
                    </Button>
                  </div>
                )}

                {!isLoadingAddresses && !addressError && addresses && addresses.length > 0 && (
                  <div className="space-y-3">
                    {addresses.map((addr) => {
                      const isSelected = selectedAddressId === addr.id;
                      return (
                        <div
                          key={addr.id}
                          onClick={() => setSelectedAddressId(addr.id)}
                          className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-start justify-between ${
                            isSelected
                              ? "border-[var(--color-primary-500)] bg-[var(--color-primary-50)]/30"
                              : "border-slate-100 hover:border-slate-200 bg-white"
                          }`}
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-slate-900 text-sm">
                                {addr.rua}{addr.numero ? `, ${addr.numero}` : ''} {addr.complemento && `\n${addr.complemento}`}
                              </p>
                              {addr.is_default && (
                                <span className="text-[10px] bg-emerald-100 text-emerald-700 font-medium px-2 py-0.5 rounded-full">
                                  Padrão
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-500">
                              {addr.bairro}, {addr.cidade} {addr.estado} CEP: {addr.cep}
                            </p>
                          </div>
                          <div
                            className={`h-5 w-5 rounded-full border flex items-center justify-center shrink-0 ${
                              isSelected
                                ? "border-[var(--color-primary-500)] bg-[var(--color-primary-500)] text-white"
                                : "border-slate-300"
                            }`}
                          >
                            {isSelected && <Check className="h-3 w-3" />}
                          </div>
                        </div>
                      );
                    })}
                    <div className="pt-1">
                      <div className="pt-1">
                      <Button asChild variant="outline" className="w-full gap-2 border-dashed h-11 rounded-xl">
                        <Link to="/tutor/perfil#meus-enderecos" onClick={() => sessionStorage.setItem("come_from_checkout", "true")}>
                          <Plus className="h-4 w-4" />
                            Cadastrar Novo Endereço
                        </Link>    
                      </Button>
                     </div>
                    </div>
                  </div>
                )}

                <Button
                  size="lg"
                  className="w-full gap-2 rounded-xl h-12"
                  onClick={handleNextFromAddress}
                  disabled={!selectedAddressId || isLoadingAddresses}
                >
                  Continuar para Pagamento
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </motion.div>
            )}

            {/* STEP 2: Payment */}
            {currentStep === "payment" && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-5"
              >
                <div className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-[var(--color-primary-500)]" />
                  <h2 className="font-bold text-slate-900 font-[family-name:var(--font-display)]">
                    Forma de Pagamento
                  </h2>
                </div>

                {paymentConfig.isError && <p role="alert" className="text-sm text-rose-700">Não foi possível carregar os meios de pagamento. <button onClick={() => void paymentConfig.refetch()} className="underline">Tentar novamente</button></p>}
                {mercadoPagoEnabled && <p className="text-sm text-slate-600">Pagamento de teste no Mercado Pago. Você escolherá o meio de pagamento na próxima etapa. Use apenas cartões e conta de teste.</p>}
                {!mercadoPagoEnabled && <>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { key: "credit" as const, icon: CreditCard, label: "Cartão" },
                    { key: "pix" as const, icon: QrCode, label: "PIX" },
                  ].map((m) => (
                    <button
                      key={m.key}
                      onClick={() => setPaymentMethod(m.key)}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                        paymentMethod === m.key
                          ? "border-[var(--color-primary-500)] bg-[var(--color-primary-50)]"
                          : "border-slate-100 hover:border-slate-200"
                      }`}
                    >
                      <m.icon
                        className={`h-6 w-6 ${
                          paymentMethod === m.key ? "text-[var(--color-primary-600)]" : "text-slate-400"
                        }`}
                      />
                      <span
                        className={`text-xs font-semibold ${
                          paymentMethod === m.key ? "text-[var(--color-primary-700)]" : "text-slate-600"
                        }`}
                      >
                        {m.label}
                      </span>
                    </button>
                  ))}
                </div>

                <SimulatedPaymentNotice />
                </>}

                <Button
                  size="lg"
                  className="w-full gap-2 rounded-xl h-12"
                  onClick={handleNextFromPayment}
                  disabled={paymentConfig.isPending || paymentConfig.isError}
                >
                  Revisar Pedido
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </motion.div>
            )}

            {/* STEP 3: Review */}
            {currentStep === "review" && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-[var(--color-primary-500)]" />
                      <h3 className="font-bold text-sm text-slate-900">Endereço</h3>
                    </div>
                    <button
                      onClick={() => setCurrentStep("address")}
                      className="text-xs text-[var(--color-primary-600)] font-medium hover:underline"
                    >
                      Alterar
                    </button>
                  </div>
                  {selectedAddress ? (
                    <>
                      <p className="text-sm text-slate-600">
                        {selectedAddress.rua}{selectedAddress.numero ? `, ${selectedAddress.numero}` : ''} {selectedAddress.complemento && `\n${selectedAddress.complemento}`}
                      </p>
                      <p className="text-sm text-slate-500">
                        {selectedAddress.bairro}, {selectedAddress.cidade} {selectedAddress.estado}, {selectedAddress.cep}
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-slate-500">Nenhum endereço selecionado.</p>
                  )}
                </div>

                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-[var(--color-primary-500)]" />
                      <h3 className="font-bold text-sm text-slate-900">Pagamento</h3>
                    </div>
                    <button
                      onClick={() => setCurrentStep("payment")}
                      className="text-xs text-[var(--color-primary-600)] font-medium hover:underline"
                    >
                      Alterar
                    </button>
                  </div>
                  <p className="text-sm text-slate-600">
                    {mercadoPagoEnabled
                      ? 'Mercado Pago (teste)'
                      : `${paymentMethod === "pix" ? "PIX" : "Cartão de Crédito"} (simulado)`}
                  </p>
                </div>

                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Package className="h-4 w-4 text-[var(--color-primary-500)]" />
                    <h3 className="font-bold text-sm text-slate-900">
                      Itens ({totalItems})
                    </h3>
                  </div>
                  <div className="space-y-3">
                    {items.map((item) => (
                      <div key={item.id} className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-lg overflow-hidden bg-slate-100 shrink-0">
                          <ImageWithFallback
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-slate-800 truncate">{item.name}</p>
                          <p className="text-xs text-slate-400">Qtd: {item.quantity}</p>
                        </div>
                        <span className="text-sm font-bold text-slate-900">
                          R$ {(item.price * item.quantity).toFixed(2).replace(".", ",")}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {!mercadoPagoEnabled && <SimulatedPaymentNotice />}

                <Button
                  size="lg"
                  className="w-full gap-2 rounded-xl h-12"
                  onClick={handleFinalize}
                  disabled={isProcessing || paymentConfig.isPending || paymentConfig.isError}
                >
                  <ShieldCheck className="h-4 w-4" />
                  Confirmar Pedido — {totalLabel}
                </Button>
              </motion.div>
            )}
          </div>

          {/* Sidebar — Order summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 sticky top-20 space-y-4">
              <h3 className="font-bold text-slate-900 text-sm font-[family-name:var(--font-display)]">
                Resumo
              </h3>
              <div className="space-y-2 text-sm">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center gap-2">
                    <div className="h-10 w-10 rounded-lg overflow-hidden bg-slate-100 shrink-0">
                      <ImageWithFallback
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-slate-700 truncate">{item.name}</p>
                      <p className="text-[10px] text-slate-400">x{item.quantity}</p>
                    </div>
                    <span className="text-xs font-bold text-slate-800">
                      R$ {(item.price * item.quantity).toFixed(2).replace(".", ",")}
                    </span>
                  </div>
                ))}
              </div>
              <div className="border-t border-slate-100 pt-3 text-sm">
                <div className="flex justify-between">
                  <span className="font-bold text-slate-900">Total</span>
                  <span className="font-bold text-slate-900 font-[family-name:var(--font-display)]">
                    {totalLabel}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Overlay de Loading do Checkout */}
      {isProcessing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4">
            <HamsterLoader />
            <p className="text-lg font-bold text-slate-800 animate-pulse font-[family-name:var(--font-display)]">
              Processando seu pedido...
            </p>
          </div>
        </div>
      )}
    </div>
  );
}