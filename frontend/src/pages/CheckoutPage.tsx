import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router";
import { motion } from "motion/react";
import { ImageWithFallback } from "../app/components/figma/ImageWithFallback";
import { useCart } from "../components/cart/CartContext";
import { HamsterLoader } from "../components/ui/HamsterLoader";
import { useAddresses } from "../lib/hooks/useAddresses";
import { toast } from "sonner";
import {
  ArrowLeft,
  CreditCard,
  QrCode,
  Barcode,
  MapPin,
  Truck,
  ShieldCheck,
  Lock,
  ChevronRight,
  Check,
  Package,
  Plus,
  AlertCircle,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";

type Step = "address" | "payment" | "review";

const STEPS: { key: Step; label: string }[] = [
  { key: "address", label: "Endereço" },
  { key: "payment", label: "Pagamento" },
  { key: "review", label: "Revisão" },
];

export function CheckoutPage() {
  const { items, totalPrice, totalItems, clearCart } = useCart();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<Step>("address");
  const [isProcessing, setIsProcessing] = useState(false);

  // Hook de endereços (Substitui o estado estático anterior)
  const { addresses, isLoading: isLoadingAddresses, error: addressError } = useAddresses();
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);

  // Seleciona automaticamente o endereço padrão (is_default) ou o primeiro da lista
  useEffect(() => {
    if (addresses && addresses.length > 0 && !selectedAddressId) {
      const defaultAddress = addresses.find((addr) => addr.is_default) || addresses[0];
      setSelectedAddressId(defaultAddress.id);
    }
  }, [addresses, selectedAddressId]);

  // Recupera o objeto do endereço selecionado para exibir no resumo da revisão
  const selectedAddress = addresses?.find((addr) => addr.id === selectedAddressId);

  // Payment
  const [paymentMethod, setPaymentMethod] = useState<"credit" | "pix" | "boleto">("credit");
  const [cardData, setCardData] = useState({
    number: "",
    name: "",
    expiry: "",
    cvv: "",
  });

  // Funções de máscara para os campos de cartão
  const maskCardNumber = (value: string) => {
    return value
      .replace(/\D/g, "")
      .slice(0, 16)
      .replace(/(\d{4})(?=\d)/g, "$1 ");
  };

  const maskExpiry = (value: string) => {
    return value
      .replace(/\D/g, "")
      .slice(0, 4)
      .replace(/(\d{2})(\d{1,2})/, "$1/$2");
  };

  const maskCVV = (value: string) => {
    return value.replace(/\D/g, "").slice(0, 4);
  };

  const shipping = totalPrice >= 199 ? 0 : 14.9;
  const finalTotal = totalPrice + shipping;

  const stepIndex = STEPS.findIndex((s) => s.key === currentStep);

  if (items.length === 0) {
    navigate("/cart");
    return null;
  }

  // Validação e avanço do passo de endereço
  const handleNextFromAddress = () => {
    if (!selectedAddressId) {
      toast.error("Por favor, selecione um endereço de entrega.");
      return;
    }
    setCurrentStep("payment");
  };

  // Validação e avanço do passo de pagamento
  const handleNextFromPayment = () => {
    if (paymentMethod === "credit") {
      const cleanNumber = cardData.number.replace(/\D/g, "");
      if (cleanNumber.length < 16 || !cardData.name || cardData.expiry.length < 5 || cardData.cvv.length < 3) {
        toast.error("Preencha todos os dados do cartão corretamente.");
        return;
      }

      // Validação de validade vencida (MM/AA)
      const [month, year] = cardData.expiry.split("/").map(Number);
      const now = new Date();
      const currentYear = now.getFullYear() % 100;
      const currentMonth = now.getMonth() + 1;

      if (!month || month > 12 || year < currentYear || (year === currentYear && month < currentMonth)) {
        toast.error("A validade do cartão está vencida ou inválida.");
        return;
      }
    }
    setCurrentStep("review");
  };

  const handleFinalize = async () => {
    setIsProcessing(true);
    // TODO CHK-2: Ligar POST /orders quando PED-1/PED-2 estiverem prontos (Pagamento SIMULADO)
    await new Promise((r) => setTimeout(r, 2000));
    clearCart();
    navigate("/checkout/success");
  };

  return (
    <div className="min-h-screen bg-slate-50">
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

                {/* ESTADO 1: Loading */}
                {isLoadingAddresses && (
                  <div className="flex flex-col items-center justify-center p-8 space-y-3">
                    <div className="h-8 w-8 border-4 border-[var(--color-primary-500)] border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm text-slate-500">Carregando seus endereços...</p>
                  </div>
                )}

                {/* ESTADO 2: Erro */}
                {addressError && (
                  <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-700">
                    <AlertCircle className="h-5 w-5 shrink-0" />
                    <p className="text-sm">Não foi possível carregar os endereços. Tente novamente mais tarde.</p>
                  </div>
                )}

                {/* ESTADO 3: Vazio */}
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

                {/* ESTADO 4: Sucesso (Lista de Endereços com propriedades corrigidas para rua) */}
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
                                {addr.rua}, {addr.numero} {addr.complemento && `- ${addr.complemento}`}
                              </p>
                              {addr.is_default && (
                                <span className="text-[10px] bg-emerald-100 text-emerald-700 font-medium px-2 py-0.5 rounded-full">
                                  Padrão
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-500">
                              {addr.bairro}, {addr.cidade} - {addr.estado} • CEP: {addr.cep}
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

                {/* Shipping option */}
                <div className="border border-slate-100 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-emerald-50">
                      <Truck className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-slate-900">Entrega Padrão</p>
                      <p className="text-xs text-slate-500">3 a 5 dias úteis</p>
                    </div>
                    <span className={`text-sm font-bold ${shipping === 0 ? "text-emerald-600" : "text-slate-900"}`}>
                      {shipping === 0 ? "Grátis" : `R$ ${shipping.toFixed(2).replace(".", ",")}`}
                    </span>
                  </div>
                </div>

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

                {/* Payment methods */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { key: "credit" as const, icon: CreditCard, label: "Cartão" },
                    { key: "pix" as const, icon: QrCode, label: "PIX" },
                    { key: "boleto" as const, icon: Barcode, label: "Boleto" },
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

                {/* Credit card form */}
                {paymentMethod === "credit" && (
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <Label>Número do Cartão</Label>
                      <Input
                        placeholder="0000 0000 0000 0000"
                        value={cardData.number}
                        onChange={(e) => setCardData({ ...cardData, number: maskCardNumber(e.target.value) })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Nome no Cartão</Label>
                      <Input
                        placeholder="Como impresso no cartão"
                        value={cardData.name}
                        onChange={(e) => setCardData({ ...cardData, name: e.target.value })}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label>Validade</Label>
                        <Input
                          placeholder="MM/AA"
                          value={cardData.expiry}
                          onChange={(e) => setCardData({ ...cardData, expiry: maskExpiry(e.target.value) })}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label>CVV</Label>
                        <Input
                          placeholder="000"
                          value={cardData.cvv}
                          onChange={(e) => setCardData({ ...cardData, cvv: maskCVV(e.target.value) })}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* PIX info */}
                {paymentMethod === "pix" && (
                  <div className="bg-slate-50 rounded-xl p-5 text-center space-y-3">
                    <QrCode className="h-16 w-16 text-slate-300 mx-auto" />
                    <p className="text-sm text-slate-600">
                      O QR Code PIX será gerado após a confirmação do pedido.
                    </p>
                    <p className="text-xs text-emerald-600 font-medium">
                      5% de desconto no PIX!
                    </p>
                  </div>
                )}

                {/* Boleto info */}
                {paymentMethod === "boleto" && (
                  <div className="bg-slate-50 rounded-xl p-5 text-center space-y-3">
                    <Barcode className="h-16 w-16 text-slate-300 mx-auto" />
                    <p className="text-sm text-slate-600">
                      O boleto será gerado com vencimento em 3 dias úteis.
                    </p>
                    <p className="text-xs text-slate-500">
                      Pedido confirmado após compensação (1 a 3 dias úteis).
                    </p>
                  </div>
                )}

                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Lock className="h-3.5 w-3.5" />
                  <span>Seus dados estão protegidos com criptografia SSL</span>
                </div>

                <Button
                  size="lg"
                  className="w-full gap-2 rounded-xl h-12"
                  onClick={handleNextFromPayment}
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
                {/* Address summary */}
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
                        {selectedAddress.rua}, {selectedAddress.numero} {selectedAddress.complemento && `- ${selectedAddress.complemento}`}
                      </p>
                      <p className="text-sm text-slate-500">
                        {selectedAddress.bairro}, {selectedAddress.cidade} - {selectedAddress.estado}, {selectedAddress.cep}
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-slate-500">Nenhum endereço selecionado.</p>
                  )}
                </div>

                {/* Payment summary */}
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
                    {paymentMethod === "credit"
                      ? "Cartão de Crédito"
                      : paymentMethod === "pix"
                      ? "PIX (5% de desconto)"
                      : "Boleto Bancário"}
                  </p>
                </div>

                {/* Items */}
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

                {/* Finalize */}
                <Button
                  size="lg"
                  className="w-full gap-2 rounded-xl h-12"
                  onClick={handleFinalize}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Processando...
                    </div>
                  ) : (
                    <>
                      <ShieldCheck className="h-4 w-4" />
                      Confirmar Pedido — R$ {finalTotal.toFixed(2).replace(".", ",")}
                    </>
                  )}
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
              <div className="border-t border-slate-100 pt-3 space-y-2 text-sm">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal</span>
                  <span>R$ {totalPrice.toFixed(2).replace(".", ",")}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Frete</span>
                  <span className={shipping === 0 ? "text-emerald-600 font-medium" : ""}>
                    {shipping === 0 ? "Grátis" : `R$ ${shipping.toFixed(2).replace(".", ",")}`}
                  </span>
                </div>
                <div className="border-t border-slate-100 pt-2 flex justify-between">
                  <span className="font-bold text-slate-900">Total</span>
                  <span className="font-bold text-slate-900 font-[family-name:var(--font-display)]">
                    R$ {finalTotal.toFixed(2).replace(".", ",")}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}