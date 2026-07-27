import {
  FileText,
  Shield,
  Scale,
  Users,
  AlertTriangle,
  CreditCard,
  Ban,
  RefreshCcw,
  Gavel,
  Mail,
  PawPrint,
} from "lucide-react";
import type { LegalDocument } from "./types";

export const termsDocument: LegalDocument = {
  lastUpdated: "20 de fevereiro de 2026",
  sections: [
    {
      id: "aceitacao",
      icon: FileText,
      title: "1. Aceitação dos Termos",
      content: `Ao acessar ou utilizar a plataforma Pet+ ("Plataforma"), incluindo o site, aplicativos móveis e quaisquer serviços relacionados, você ("Usuário") declara que leu, compreendeu e concorda integralmente com estes Termos de Uso ("Termos"). Caso não concorde com alguma disposição, solicitamos que não utilize a Plataforma.

A utilização continuada da Plataforma após eventuais atualizações destes Termos constitui aceitação das modificações. Recomendamos a consulta periódica deste documento.

Ao se cadastrar, o Usuário confirma ter pelo menos 18 (dezoito) anos de idade ou contar com autorização de seu representante legal para utilizar os serviços.`,
    },
    {
      id: "definicoes",
      icon: Users,
      title: "2. Definições",
      content: `Para os fins destes Termos, consideram-se:

• **Plataforma**: o conjunto de sistemas, sites e aplicativos operados pela Pet+ Inc.
• **Tutor**: pessoa física cadastrada que busca serviços ou produtos para seus animais de estimação.
• **Parceiro**: pessoa física ou jurídica que oferece serviços de Hotelaria, Pet Sitter ou produtos no Shopping da Plataforma.
• **Serviços**: funcionalidades disponibilizadas pela Plataforma, incluindo busca, reserva, contratação e compra de produtos e serviços pet.
• **Conteúdo do Usuário**: textos, fotos, avaliações e demais materiais publicados por Tutores ou Parceiros.
• **Shopping**: marketplace integrado à Plataforma para comercialização de produtos pet.`,
    },
    {
      id: "cadastro",
      icon: Shield,
      title: "3. Cadastro e Conta",
      content: `Para utilizar determinados recursos da Plataforma, o Usuário deverá criar uma conta fornecendo informações verídicas, completas e atualizadas. O Usuário é integralmente responsável por:

• Manter a confidencialidade de suas credenciais de acesso (e-mail e senha);
• Todas as atividades realizadas em sua conta;
• Notificar imediatamente a Pet+ em caso de uso não autorizado de sua conta;
• Manter seus dados cadastrais atualizados.

A Pet+ reserva-se o direito de suspender ou encerrar contas que contenham informações falsas, incompletas ou que violem estes Termos, sem aviso prévio e sem que isso gere direito a indenização.`,
    },
    {
      id: "servicos",
      icon: PawPrint,
      title: "4. Descrição dos Serviços",
      content: `A Pet+ atua como plataforma intermediadora, conectando Tutores a Parceiros que oferecem:

**Hotelaria Pet**: hospedagem temporária para animais de estimação em estabelecimentos cadastrados e avaliados pela comunidade.

**Pet Sitter**: serviço de cuidadores que acompanham e cuidam dos animais no domicílio do Tutor ou em outro local acordado.

**Shopping**: marketplace para aquisição de produtos pet (alimentação, higiene, acessórios, farmácia, conforto, roupas e beleza).

A Pet+ não é prestadora direta dos serviços de Hotelaria e Pet Sitter, tampouco fabricante ou vendedora dos produtos do Shopping. A relação contratual de prestação de serviço ou compra e venda se estabelece diretamente entre o Tutor e o Parceiro.`,
    },
    {
      id: "obrigacoes",
      icon: Scale,
      title: "5. Obrigações do Usuário",
      content: `Ao utilizar a Plataforma, o Usuário compromete-se a:

• Fornecer informações verdadeiras e precisas sobre si e sobre seus animais de estimação;
• Utilizar a Plataforma de forma ética, respeitando a legislação vigente e os direitos de terceiros;
• Não publicar conteúdo ofensivo, discriminatório, difamatório ou que viole direitos autorais;
• Não utilizar a Plataforma para fins ilícitos, fraudulentos ou que possam causar danos a terceiros;
• Manter atualizadas as informações de vacinação e saúde de seus pets ao contratar serviços;
• Respeitar os horários de check-in/check-out acordados com os Parceiros de Hotelaria;
• Realizar o pagamento pontual dos serviços e produtos contratados;
• Comunicar à Pet+ qualquer irregularidade verificada em serviços ou produtos.`,
    },
    {
      id: "pagamentos",
      icon: CreditCard,
      title: "6. Pagamentos e Política de Preços",
      content: `Os preços dos serviços e produtos são definidos pelos respectivos Parceiros e exibidos na Plataforma antes da confirmação pelo Tutor. A Pet+ poderá cobrar taxas de serviço, que serão informadas de forma transparente antes da finalização da transação.

**Métodos de pagamento**: cartão de crédito, cartão de débito, PIX e boleto bancário, conforme disponibilidade.

**Parcelamento**: disponível para compras no Shopping conforme condições exibidas no checkout.

**Faturamento**: os valores são processados por parceiros de pagamento homologados, garantindo segurança nas transações.

**Cancelamentos e reembolsos**: sujeitos à política específica de cada serviço/produto, detalhada na seção correspondente ou no momento da contratação.`,
    },
    {
      id: "cancelamento",
      icon: RefreshCcw,
      title: "7. Cancelamento e Reembolso",
      content: `**Serviços (Hotelaria e Pet Sitter)**:
• Cancelamento com mais de 48h de antecedência: reembolso integral;
• Cancelamento entre 24h e 48h: reembolso de 50% do valor;
• Cancelamento com menos de 24h: sem reembolso, salvo casos de força maior;
• O Parceiro que cancelar sem justificativa poderá sofrer penalidades na Plataforma.

**Shopping (Produtos)**:
• Direito de arrependimento: até 7 dias corridos após o recebimento, conforme o Código de Defesa do Consumidor;
• O produto deve estar lacrado e em sua embalagem original;
• O frete de devolução será por conta da Pet+ nos casos de arrependimento dentro do prazo legal;
• Produtos com defeito: troca ou reembolso integral em até 30 dias.`,
    },
    {
      id: "propriedade",
      icon: Gavel,
      title: "8. Propriedade Intelectual",
      content: `Todo o conteúdo da Plataforma — incluindo, mas não se limitando a, textos, imagens, logotipos, ícones, layouts, códigos, marcas e nomes comerciais — é de propriedade exclusiva da Pet+ Inc. ou de seus licenciadores, estando protegido pelas leis brasileiras e internacionais de propriedade intelectual.

É expressamente vedado ao Usuário:
• Reproduzir, distribuir ou modificar qualquer conteúdo da Plataforma sem autorização prévia e por escrito;
• Utilizar robôs, scrapers ou ferramentas automatizadas para extrair dados da Plataforma;
• Utilizar a marca "Pet+" ou quaisquer sinais distintivos da Plataforma sem autorização.

O Conteúdo do Usuário (avaliações, fotos, comentários) permanece de autoria do Usuário, porém ao publicá-lo na Plataforma, o Usuário concede à Pet+ licença gratuita, não exclusiva, mundial e por prazo indeterminado para uso, reprodução e exibição do conteúdo.`,
    },
    {
      id: "responsabilidade",
      icon: AlertTriangle,
      title: "9. Limitação de Responsabilidade",
      content: `A Pet+ empenha-se em manter a Plataforma disponível e funcionando corretamente, porém não garante:

• Disponibilidade ininterrupta ou isenta de erros da Plataforma;
• Que os resultados obtidos através da Plataforma atendam integralmente às expectativas do Usuário;
• A qualidade dos serviços prestados por Parceiros ou dos produtos vendidos no Shopping.

A Pet+ não será responsável por:
• Danos diretos, indiretos, incidentais ou consequentes resultantes do uso da Plataforma;
• Condutas de Parceiros ou de outros Usuários;
• Perda de dados decorrente de falhas técnicas, desde que adote medidas razoáveis de segurança;
• Eventos de força maior ou caso fortuito.

Em caso de litígio entre Tutor e Parceiro, a Pet+ poderá mediar a situação, mas não é obrigada a intervir ou a assumir responsabilidade.`,
    },
    {
      id: "encerramento",
      icon: Ban,
      title: "10. Suspensão e Encerramento",
      content: `A Pet+ poderá, a seu exclusivo critério e sem necessidade de aviso prévio, suspender ou encerrar a conta do Usuário que:

• Violar estes Termos de Uso ou a Política de Privacidade;
• Praticar condutas fraudulentas ou ilícitas;
• Causar danos à Plataforma, a outros Usuários ou a Parceiros;
• Permanecer inativo por período superior a 24 meses;
• Acumular avaliações negativas recorrentes sem demonstrar melhoria.

O Usuário pode solicitar o encerramento de sua conta a qualquer momento, entrando em contato pelo canal indicado na seção "Contato". O encerramento não isenta o Usuário de obrigações pendentes.`,
    },
    {
      id: "modificacoes",
      icon: RefreshCcw,
      title: "11. Modificações dos Termos",
      content: `A Pet+ reserva-se o direito de alterar estes Termos a qualquer momento, publicando a versão atualizada na Plataforma. Alterações relevantes serão comunicadas por e-mail ou notificação na Plataforma com, no mínimo, 15 (quinze) dias de antecedência.

A continuidade de uso da Plataforma após a vigência das alterações implica aceitação dos novos Termos. Caso o Usuário discorde, deverá cessar a utilização da Plataforma e solicitar o encerramento de sua conta.`,
    },
    {
      id: "contato",
      icon: Mail,
      title: "12. Foro e Contato",
      content: `Estes Termos são regidos pelas leis da República Federativa do Brasil. Fica eleito o foro da Comarca de São Paulo/SP como competente para dirimir quaisquer controvérsias decorrentes destes Termos, com renúncia expressa a qualquer outro, por mais privilegiado que seja.

**Canais de contato**:
• E-mail: termos@petplus.com.br
• Central de Ajuda: disponível na Plataforma (seção "Ajuda")
• Endereço: Av. Paulista, 1000, 10° andar — São Paulo/SP — CEP 01310-100

Horário de atendimento: segunda a sexta, das 8h às 20h (horário de Brasília).`,
    },
  ],
};
