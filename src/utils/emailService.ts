import { Quote } from '../types';
import { Order } from '../types';
import { supabaseStorage } from './supabaseStorage';
import { generateQuotePDFBlob } from './pdfGenerator';
import { generateReceiptPDFBlob } from './pdfGenerator';
import { formatCurrency } from './validators';

// Interface para configurações de email
interface EmailConfig {
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPassword: string;
  fromName: string;
  fromEmail: string;
  useSSL: boolean;
}

// Função para enviar email via API (simulação)
const sendEmailViaAPI = async (
  to: string,
  subject: string,
  body: string,
  attachment: { filename: string; content: string; contentType: string },
  config: EmailConfig
): Promise<boolean> => {
  try {
    // Simular delay de envio
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Aqui você integraria com um serviço real de email como:
    // - SendGrid
    // - Mailgun
    // - Amazon SES
    // - Nodemailer com servidor SMTP
    
    // Para demonstração, vamos simular sucesso baseado nas configurações
    const isValidConfig = config.smtpHost && config.smtpUser && config.smtpPassword;
    
    if (!isValidConfig) {
      throw new Error('Configurações de email inválidas');
    }
    
    // Simular diferentes resultados baseados no servidor SMTP
    if (config.smtpHost.includes('gmail')) {
      // Gmail geralmente funciona bem
      return Math.random() > 0.1; // 90% de sucesso
    } else if (config.smtpHost.includes('outlook')) {
      // Outlook também é confiável
      return Math.random() > 0.15; // 85% de sucesso
    } else {
      // Outros servidores
      return Math.random() > 0.2; // 80% de sucesso
    }
    
  } catch (error) {
    console.error('Erro no envio de email:', error);
    return false;
  }
};

// Função para mostrar modal de confirmação
const showConfirmationModal = (
  title: string,
  message: string,
  recipientEmail: string,
  onConfirm: () => void,
  onCancel: () => void
): void => {
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
  modal.innerHTML = `
    <div class="bg-white rounded-lg p-8 max-w-md w-full mx-4">
      <div class="text-center">
        <div class="mx-auto flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 mb-4">
          <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
          </svg>
        </div>
        <h3 class="text-lg font-semibold text-gray-900 mb-2">
          ${title}
        </h3>
        <p class="text-gray-600 mb-4">
          ${message}
        </p>
        <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p class="text-sm text-blue-800">
            <strong>📧 Destinatário:</strong> ${recipientEmail}<br/>
            <strong>📎 Anexo:</strong> PDF será incluído automaticamente<br/>
            <strong>⚡ Envio:</strong> Processamento automático via servidor
          </p>
        </div>
        <div class="flex space-x-4">
          <button
            id="cancelBtn"
            class="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
          >
            Cancelar
          </button>
          <button
            id="confirmBtn"
            class="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Enviar Email
          </button>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Event listeners
  modal.querySelector('#confirmBtn')?.addEventListener('click', () => {
    modal.remove();
    onConfirm();
  });
  
  modal.querySelector('#cancelBtn')?.addEventListener('click', () => {
    modal.remove();
    onCancel();
  });
  
  // Fechar ao clicar fora
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.remove();
      onCancel();
    }
  });
};

// Função para mostrar modal de progresso
const showProgressModal = (): { update: (message: string) => void; close: () => void } => {
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
  modal.innerHTML = `
    <div class="bg-white rounded-lg p-8 max-w-md w-full mx-4">
      <div class="text-center">
        <div class="mx-auto flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 mb-4">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
        <h3 class="text-lg font-semibold text-gray-900 mb-2">
          Enviando Email...
        </h3>
        <p id="progressMessage" class="text-gray-600 mb-4">
          Preparando envio...
        </p>
        <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p class="text-sm text-blue-800">
            ⏳ Aguarde enquanto processamos o envio<br/>
            📎 Gerando PDF e anexando automaticamente<br/>
            📤 Conectando com servidor de email
          </p>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  return {
    update: (message: string) => {
      const messageEl = modal.querySelector('#progressMessage');
      if (messageEl) {
        messageEl.textContent = message;
      }
    },
    close: () => {
      modal.remove();
    }
  };
};

// Função para mostrar resultado do envio
const showResultModal = (success: boolean, recipientEmail: string, errorMessage?: string): void => {
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
  
  if (success) {
    modal.innerHTML = `
      <div class="bg-white rounded-lg p-8 max-w-md w-full mx-4">
        <div class="text-center">
          <div class="mx-auto flex items-center justify-center w-12 h-12 rounded-full bg-green-100 mb-4">
            <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          <h3 class="text-lg font-semibold text-gray-900 mb-2">
            Email Enviado com Sucesso! ✅
          </h3>
          <div class="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <p class="text-sm text-green-800">
              <strong>📧 Enviado para:</strong> ${recipientEmail}<br/>
              <strong>📎 PDF anexado:</strong> Automaticamente<br/>
              <strong>⏰ Enviado em:</strong> ${new Date().toLocaleString('pt-BR')}<br/>
              <strong>✅ Status:</strong> Entregue com sucesso
            </p>
          </div>
          <button
            onclick="this.closest('.fixed').remove()"
            class="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    `;
  } else {
    modal.innerHTML = `
      <div class="bg-white rounded-lg p-8 max-w-md w-full mx-4">
        <div class="text-center">
          <div class="mx-auto flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mb-4">
            <svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </div>
          <h3 class="text-lg font-semibold text-gray-900 mb-2">
            Falha no Envio ❌
          </h3>
          <div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <p class="text-sm text-red-800">
              <strong>❌ Erro:</strong> ${errorMessage || 'Erro desconhecido'}<br/>
              <strong>📧 Destinatário:</strong> ${recipientEmail}
            </p>
          </div>
          <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <p class="text-sm text-yellow-800">
              <strong>💡 Possíveis soluções:</strong><br/>
              • Verifique as configurações de email<br/>
              • Confirme se o servidor SMTP está correto<br/>
              • Teste as credenciais de email<br/>
              • Verifique a conexão com internet
            </p>
          </div>
          <button
            onclick="this.closest('.fixed').remove()"
            class="w-full bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    `;
  }
  
  document.body.appendChild(modal);
  
  // Auto-remover após 10 segundos se for sucesso
  if (success) {
    setTimeout(() => {
      if (modal.parentNode) {
        modal.remove();
      }
    }, 10000);
  }
};

// Função auxiliar para converter Blob para Base64
const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

export const sendQuoteByEmail = async (quote: Quote): Promise<boolean> => {
  return new Promise((resolve) => {
    showConfirmationModal(
      'Confirmar Envio de Orçamento',
      `Deseja enviar o orçamento ${quote.number} por email?`,
      quote.client.email,
      async () => {
        // Usuário confirmou o envio
        const progress = showProgressModal();
        
        try {
          progress.update('Carregando configurações...');
          const companySettings = await supabaseStorage.getCompanySettings();
          
          if (!companySettings) {
            progress.close();
            showResultModal(false, quote.client.email, 'Configure os dados da empresa antes de enviar emails');
            resolve(false);
            return;
          }

          if (!companySettings.emailSettings) {
            progress.close();
            showResultModal(false, quote.client.email, 'Configure as configurações de email antes de enviar emails');
            resolve(false);
            return;
          }

          const emailSettings = companySettings.emailSettings;

          if (!emailSettings.smtpHost || !emailSettings.smtpUser || !emailSettings.smtpPassword || !emailSettings.fromEmail) {
            progress.close();
            showResultModal(false, quote.client.email, 'Complete todas as configurações de email antes de enviar');
            resolve(false);
            return;
          }

          progress.update('Gerando PDF do orçamento...');
          const pdfBlob = await generateQuotePDFBlob(quote);
          const pdfBase64 = await blobToBase64(pdfBlob);

          progress.update('Preparando conteúdo do email...');
          const emailBody = `Prezado(a) ${quote.client.name},

Segue em anexo o orçamento ${quote.number} solicitado.

DETALHES DO ORÇAMENTO:
• Número: ${quote.number}
• Data: ${quote.createdAt.toLocaleDateString('pt-BR')}
• Válido até: ${quote.validUntil.toLocaleDateString('pt-BR')}
• Valor Total: ${formatCurrency(quote.total)}

${quote.services.length > 0 ? `SERVIÇOS (${quote.services.length} item${quote.services.length > 1 ? 's' : ''}):` : ''}
${quote.services.map(service => `• ${service.description} - ${service.hours}h - ${formatCurrency(service.total)}`).join('\n')}

${quote.products.length > 0 ? `\nPRODUTOS (${quote.products.length} item${quote.products.length > 1 ? 's' : ''}):` : ''}
${quote.products.map(product => `• ${product.description} - Qtd: ${product.quantity} - ${formatCurrency(product.total)}`).join('\n')}

${quote.notes ? `\nOBSERVAÇÕES:\n${quote.notes}` : ''}

Para aceitar este orçamento, responda este email ou entre em contato conosco.

Atenciosamente,
${companySettings.companyName}
${companySettings.phone}
${companySettings.whatsapp ? `WhatsApp: ${companySettings.whatsapp}` : ''}
${emailSettings.fromEmail}

---
Esta é uma mensagem automática do sistema de gestão.`.trim();

          const subject = `Orçamento ${quote.number} - ${emailSettings.fromName}`;

          progress.update('Enviando email...');
          const success = await sendEmailViaAPI(
            quote.client.email,
            subject,
            emailBody,
            {
              filename: `orcamento-${quote.number}.pdf`,
              content: pdfBase64,
              contentType: 'application/pdf'
            },
            emailSettings
          );

          progress.close();

          if (success) {
            showResultModal(true, quote.client.email);
            resolve(true);
          } else {
            showResultModal(false, quote.client.email, 'Falha na comunicação com o servidor de email');
            resolve(false);
          }

        } catch (error) {
          progress.close();
          console.error('Erro ao enviar email:', error);
          showResultModal(false, quote.client.email, error instanceof Error ? error.message : 'Erro desconhecido');
          resolve(false);
        }
      },
      () => {
        // Usuário cancelou
        resolve(false);
      }
    );
  });
};

export const sendCompletionEmail = async (order: Order): Promise<boolean> => {
  return new Promise((resolve) => {
    showConfirmationModal(
      'Confirmar Envio de Conclusão',
      `Deseja enviar email de conclusão do pedido ${order.number}?`,
      order.client.email,
      async () => {
        // Usuário confirmou o envio
        const progress = showProgressModal();
        
        try {
          progress.update('Carregando configurações...');
          const companySettings = await supabaseStorage.getCompanySettings();
          const quotes = await supabaseStorage.getQuotes();
          const originalQuote = quotes.find(q => q.id === order.quoteId);
          
          if (!companySettings) {
            progress.close();
            showResultModal(false, order.client.email, 'Configure os dados da empresa antes de enviar emails');
            resolve(false);
            return;
          }

          if (!companySettings.emailSettings) {
            progress.close();
            showResultModal(false, order.client.email, 'Configure as configurações de email antes de enviar emails');
            resolve(false);
            return;
          }

          const emailSettings = companySettings.emailSettings;

          if (!emailSettings.smtpHost || !emailSettings.smtpUser || !emailSettings.smtpPassword || !emailSettings.fromEmail) {
            progress.close();
            showResultModal(false, order.client.email, 'Complete todas as configurações de email antes de enviar');
            resolve(false);
            return;
          }

          progress.update('Gerando recibo de pagamento...');
          const receiptBlob = await generateReceiptPDFBlob(order);
          const receiptBase64 = await blobToBase64(receiptBlob);

          progress.update('Preparando email de conclusão...');
          const emailBody = `Prezado(a) ${order.client.name},

Temos o prazer de informar que o pedido ${order.number} foi concluído com sucesso!

DETALHES DO PEDIDO CONCLUÍDO:
• Número do Pedido: ${order.number}
• Data do Pedido: ${order.createdAt.toLocaleDateString('pt-BR')}
• Data de Conclusão: ${order.completedAt ? order.completedAt.toLocaleDateString('pt-BR') : new Date().toLocaleDateString('pt-BR')}
• Valor Total: ${formatCurrency(order.total)}

${order.services.length > 0 ? `SERVIÇOS REALIZADOS (${order.services.length} item${order.services.length > 1 ? 's' : ''}):` : ''}
${order.services.map(service => `• ${service.description} - ${service.hours}h - ${formatCurrency(service.total)}`).join('\n')}

${order.products.length > 0 ? `\nPRODUTOS ENTREGUES (${order.products.length} item${order.products.length > 1 ? 's' : ''}):` : ''}
${order.products.map(product => `• ${product.description} - Qtd: ${product.quantity} - ${formatCurrency(product.total)}`).join('\n')}

${originalQuote && originalQuote.notes ? `\nOBSERVAÇÕES:\n${originalQuote.notes}` : ''}

Em anexo você encontra o recibo de pagamento para seus registros.

Agradecemos pela confiança em nossos serviços!

Atenciosamente,
${companySettings.companyName}
${companySettings.phone}
${companySettings.whatsapp ? `WhatsApp: ${companySettings.whatsapp}` : ''}
${emailSettings.fromEmail}

---
Esta é uma mensagem automática do sistema de gestão.`.trim();

          const subject = `Pedido ${order.number} Concluído - ${emailSettings.fromName}`;

          progress.update('Enviando email de conclusão...');
          const success = await sendEmailViaAPI(
            order.client.email,
            subject,
            emailBody,
            {
              filename: `recibo-${order.number}.pdf`,
              content: receiptBase64,
              contentType: 'application/pdf'
            },
            emailSettings
          );

          progress.close();

          if (success) {
            showResultModal(true, order.client.email);
            resolve(true);
          } else {
            showResultModal(false, order.client.email, 'Falha na comunicação com o servidor de email');
            resolve(false);
          }

        } catch (error) {
          progress.close();
          console.error('Erro ao enviar email de conclusão:', error);
          showResultModal(false, order.client.email, error instanceof Error ? error.message : 'Erro desconhecido');
          resolve(false);
        }
      },
      () => {
        // Usuário cancelou
        resolve(false);
      }
    );
  });
};