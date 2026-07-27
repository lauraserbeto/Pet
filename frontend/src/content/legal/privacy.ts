import {
  Shield,
  Database,
  Eye,
  Share2,
  Lock,
  Cookie,
  Baby,
  Globe,
  UserX,
  Mail,
  RefreshCcw,
  ServerCrash,
} from "lucide-react";
import type { LegalDocument } from "./types";

export const privacyDocument: LegalDocument = {
  lastUpdated: "20 de fevereiro de 2026",
  sections: [
    {
      id: "introducao",
      icon: Shield,
      title: "1. Introdução",
      content: `A Pet+ Inc. ("Pet+", "nós" ou "nossa") valoriza a privacidade e a proteção dos dados pessoais de seus Usuários. Esta Política de Privacidade ("Política") descreve como coletamos, utilizamos, armazenamos, compartilhamos e protegemos suas informações pessoais quando você utiliza a plataforma Pet+.

Esta Política foi elaborada em conformidade com a Lei Geral de Proteção de Dados Pessoais (LGPD — Lei nº 13.709/2018) e demais normas aplicáveis à proteção de dados no Brasil.

Ao utilizar a Plataforma, você consente com as práticas descritas nesta Política. Caso não concorde, recomendamos que não utilize nossos serviços.`,
    },
    {
      id: "coleta",
      icon: Database,
      title: "2. Dados que Coletamos",
      content: `Coletamos diferentes categorias de dados, dependendo da forma como você interage com a Plataforma:

**Dados fornecidos por você**:
• Nome completo, e-mail, telefone e CPF (cadastro);
• Endereço (para entregas e serviços presenciais);
• Informações do pet (nome, raça, porte, idade, vacinação);
• Dados de pagamento (processados por parceiro homologado — não armazenamos dados de cartão);
• Fotos de perfil e do pet;
• Avaliações e comentários publicados na Plataforma.

**Dados coletados automaticamente**:
• Endereço IP, tipo de dispositivo, sistema operacional e navegador;
• Páginas visitadas, tempo de permanência e interações na Plataforma;
• Dados de localização aproximada (com seu consentimento);
• Cookies e tecnologias similares (veja seção específica).

**Dados de terceiros**:
• Informações de redes sociais (caso opte pelo login social);
• Dados fornecidos por Parceiros durante a prestação de serviços.`,
    },
    {
      id: "finalidade",
      icon: Eye,
      title: "3. Como Utilizamos seus Dados",
      content: `Utilizamos seus dados pessoais para as seguintes finalidades:

• **Prestação de serviços**: criar e gerenciar sua conta, processar reservas de Hotelaria e Pet Sitter, processar compras no Shopping;
• **Comunicação**: enviar confirmações, atualizações de pedidos, alertas de segurança e comunicações administrativas;
• **Personalização**: recomendar serviços e produtos relevantes com base no seu perfil e histórico de uso;
• **Melhoria da Plataforma**: analisar padrões de uso para aprimorar funcionalidades, desempenho e experiência do Usuário;
• **Segurança**: prevenir fraudes, abusos e atividades ilícitas na Plataforma;
• **Marketing**: enviar ofertas, promoções e novidades (com seu consentimento, podendo ser revogado a qualquer momento);
• **Obrigações legais**: cumprir exigências legais, regulatórias ou judiciais.

Não utilizamos seus dados pessoais para finalidades incompatíveis com as descritas acima sem obter seu consentimento prévio.`,
    },
    {
      id: "compartilhamento",
      icon: Share2,
      title: "4. Compartilhamento de Dados",
      content: `Seus dados pessoais poderão ser compartilhados com:

• **Parceiros da Plataforma**: Hotelarias, Pet Sitters e vendedores do Shopping recebem as informações necessárias para a prestação do serviço ou entrega do produto (nome, contato, dados do pet e endereço, quando aplicável);
• **Processadores de pagamento**: instituições financeiras homologadas para processar transações de forma segura;
• **Prestadores de serviço**: empresas contratadas para hospedar dados, enviar e-mails, realizar análises e oferecer suporte ao cliente, sempre sob termos de confidencialidade;
• **Autoridades competentes**: quando exigido por lei, regulamento ou ordem judicial;
• **Em caso de reorganização societária**: fusão, aquisição ou venda de ativos, mediante garantia de continuidade da proteção dos dados.

**Não vendemos nem alugamos seus dados pessoais a terceiros para fins de marketing direto.**`,
    },
    {
      id: "seguranca",
      icon: Lock,
      title: "5. Segurança dos Dados",
      content: `Adotamos medidas técnicas e organizacionais adequadas para proteger seus dados contra acesso não autorizado, destruição, perda, alteração ou qualquer forma de tratamento inadequado:

• Criptografia de dados em trânsito (TLS/SSL) e em repouso;
• Controle de acesso baseado em papéis (RBAC) para equipe interna;
• Monitoramento contínuo de segurança e testes de vulnerabilidade;
• Backups regulares e plano de recuperação de desastres;
• Treinamento periódico da equipe sobre proteção de dados;
• Anonimização e pseudonimização de dados quando viável.

Apesar de nossos esforços, nenhum sistema de segurança é 100% infalível. Em caso de incidente de segurança que represente risco relevante, notificaremos os Usuários afetados e a Autoridade Nacional de Proteção de Dados (ANPD) conforme a legislação vigente.`,
    },
    {
      id: "cookies",
      icon: Cookie,
      title: "6. Cookies e Tecnologias Similares",
      content: `Utilizamos cookies e tecnologias similares para melhorar sua experiência na Plataforma:

**Cookies essenciais**: necessários para o funcionamento básico da Plataforma (autenticação, carrinho de compras, preferências de sessão). Não podem ser desativados.

**Cookies de desempenho**: coletam informações sobre como os Usuários utilizam a Plataforma (páginas mais visitadas, erros). Dados são agregados e anonimizados.

**Cookies de funcionalidade**: permitem que a Plataforma lembre suas preferências (idioma, região, personalização de layout).

**Cookies de marketing**: utilizados para exibir anúncios relevantes com base no seu perfil de navegação. Podem ser desativados nas configurações do navegador.

Você pode gerenciar suas preferências de cookies a qualquer momento nas configurações da sua conta ou através das opções do seu navegador. A desativação de certos cookies pode afetar funcionalidades da Plataforma.`,
    },
    {
      id: "retencao",
      icon: ServerCrash,
      title: "7. Retenção de Dados",
      content: `Seus dados pessoais serão armazenados pelo tempo necessário para cumprir as finalidades descritas nesta Política, observando os seguintes critérios:

• **Dados de conta**: mantidos enquanto a conta estiver ativa, e por até 5 anos após o encerramento para cumprimento de obrigações legais;
• **Dados de transações**: mantidos por 5 anos para fins fiscais e contábeis;
• **Dados de navegação e cookies**: mantidos por até 12 meses;
• **Dados de marketing**: mantidos até a revogação do consentimento;
• **Logs de segurança**: mantidos por até 6 meses.

Após o término do período de retenção, os dados serão eliminados ou anonimizados de forma irreversível, salvo quando a lei exigir sua conservação.`,
    },
    {
      id: "direitos",
      icon: UserX,
      title: "8. Seus Direitos (LGPD)",
      content: `Nos termos da LGPD, você tem os seguintes direitos em relação aos seus dados pessoais:

• **Confirmação e acesso**: saber se tratamos seus dados e obter cópia;
• **Correção**: solicitar a atualização de dados incompletos, inexatos ou desatualizados;
• **Anonimização, bloqueio ou eliminação**: de dados desnecessários, excessivos ou tratados em desconformidade;
• **Portabilidade**: solicitar a transferência dos seus dados a outro fornecedor;
• **Eliminação**: dos dados tratados com base no consentimento, quando aplicável;
• **Informação**: saber com quais entidades seus dados foram compartilhados;
• **Revogação do consentimento**: a qualquer momento, sem custos;
• **Oposição**: ao tratamento de dados quando houver descumprimento da LGPD.

Para exercer seus direitos, envie uma solicitação para **privacidade@petplus.com.br**. Responderemos em até 15 dias úteis.`,
    },
    {
      id: "menores",
      icon: Baby,
      title: "9. Dados de Menores de Idade",
      content: `A Plataforma Pet+ não é destinada a menores de 18 anos. Não coletamos intencionalmente dados pessoais de crianças ou adolescentes.

Caso identifiquemos que dados de menores foram coletados inadvertidamente, providenciaremos sua exclusão imediata.

Pais ou responsáveis legais que identifiquem que um menor sob sua responsabilidade forneceu dados à Plataforma devem entrar em contato conosco para solicitar a exclusão.`,
    },
    {
      id: "internacional",
      icon: Globe,
      title: "10. Transferência Internacional",
      content: `Seus dados poderão ser transferidos e processados em servidores localizados fora do Brasil, especialmente para serviços de infraestrutura em nuvem (cloud computing).

Quando houver transferência internacional, garantimos que:
• O país de destino possua nível adequado de proteção de dados, conforme determinação da ANPD; ou
• Sejam adotadas cláusulas contratuais padrão ou outras salvaguardas apropriadas conforme a LGPD.

Atualmente, nossos dados são processados em servidores localizados no Brasil e nos Estados Unidos, sempre com medidas de proteção equivalentes às exigidas pela legislação brasileira.`,
    },
    {
      id: "alteracoes",
      icon: RefreshCcw,
      title: "11. Alterações nesta Política",
      content: `Esta Política poderá ser atualizada periodicamente para refletir mudanças em nossas práticas, na legislação ou em orientações da ANPD.

Alterações significativas serão comunicadas:
• Por e-mail para o endereço cadastrado;
• Por notificação destacada na Plataforma;
• Com, no mínimo, 15 dias de antecedência à entrada em vigor.

A data da última atualização será sempre exibida no topo desta Política. Recomendamos a revisão periódica deste documento.`,
    },
    {
      id: "contato",
      icon: Mail,
      title: "12. Encarregado (DPO) e Contato",
      content: `A Pet+ designou um Encarregado pelo Tratamento de Dados Pessoais (DPO), nos termos do art. 41 da LGPD.

**Encarregado de Dados**:
• Nome: Departamento de Privacidade — Pet+ Inc.
• E-mail: privacidade@petplus.com.br
• Endereço: Av. Paulista, 1000, 10° andar — São Paulo/SP — CEP 01310-100

Você pode entrar em contato com nosso Encarregado para:
• Exercer seus direitos como titular de dados;
• Esclarecer dúvidas sobre o tratamento de seus dados;
• Reportar incidentes de segurança ou violação de dados;
• Solicitar informações sobre nossas práticas de privacidade.

Prazo de resposta: até 15 dias úteis a partir do recebimento da solicitação.`,
    },
  ],
};
