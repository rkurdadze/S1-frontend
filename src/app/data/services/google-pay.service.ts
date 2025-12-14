import {Injectable} from '@angular/core';

interface GooglePaymentRequestConfig {
  total: number;
  currencyCode: string;
  merchantName?: string;
}

declare const google: any;

@Injectable({
  providedIn: 'root'
})
export class GooglePayService {
  private paymentsClient: any;
  private scriptLoaded = false;

  async loadLibrary(): Promise<void> {
    if (this.scriptLoaded) {
      return;
    }

    await new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://pay.google.com/gp/p/js/pay.js';
      script.onload = () => {
        this.scriptLoaded = true;
        resolve();
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  private async getClient(): Promise<any> {
    if (!this.paymentsClient) {
      await this.loadLibrary();
      this.paymentsClient = new google.payments.api.PaymentsClient({environment: 'TEST'});
    }
    return this.paymentsClient;
  }

  private buildPaymentDataRequest(config: GooglePaymentRequestConfig) {
    const allowedCardNetworks = ['VISA', 'MASTERCARD'];
    const allowedAuthMethods = ['PAN_ONLY', 'CRYPTOGRAM_3DS'];

    return {
      apiVersion: 2,
      apiVersionMinor: 0,
      allowedPaymentMethods: [
        {
          type: 'CARD',
          parameters: {
            allowedAuthMethods,
            allowedCardNetworks,
            billingAddressRequired: true,
            billingAddressParameters: {
              format: 'FULL'
            }
          },
          tokenizationSpecification: {
            type: 'PAYMENT_GATEWAY',
            parameters: {
              gateway: 'example',
              gatewayMerchantId: 'exampleGatewayMerchantId'
            }
          }
        }
      ],
      transactionInfo: {
        totalPriceStatus: 'FINAL',
        totalPrice: config.total.toFixed(2),
        currencyCode: config.currencyCode,
      },
      merchantInfo: {
        merchantName: config.merchantName || 'Studio101'
      }
    };
  }

  async pay(total: number, currencyCode: string = 'USD'): Promise<any> {
    const client = await this.getClient();
    const paymentDataRequest = this.buildPaymentDataRequest({total, currencyCode});
    return client.loadPaymentData(paymentDataRequest);
  }
}
