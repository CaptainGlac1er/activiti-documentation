package com.example.ordermanagement.services;

import com.example.ordermanagement.config.ServiceProperties;
import org.activiti.api.process.model.IntegrationContext;
import org.activiti.api.process.runtime.connector.Connector;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.Date;
import java.util.Map;
import java.util.UUID;

/**
 * Service for processing payments.
 * 
 * Called by the processPaymentTask in the paymentProcess.
 * Executes payment transaction and returns result.
 */
@Component("paymentProcessingService")
public class PaymentProcessingService implements Connector {

    private static final Logger logger = LoggerFactory.getLogger(PaymentProcessingService.class);

    @Autowired
    private ServiceProperties serviceProperties;

    @Override
    public IntegrationContext apply(IntegrationContext integrationContext) {
        logger.info("Processing payment for order: {}", 
            integrationContext.getInBoundVariables().get("orderId"));
        logger.info("Using payment gateway: {}", serviceProperties.getPayment().getGateway());
        
        String orderId = (String) integrationContext.getInBoundVariables().get("orderId");
        Object amountObj = integrationContext.getInBoundVariables().get("amount");
        BigDecimal amount = amountObj instanceof BigDecimal 
            ? (BigDecimal) amountObj 
            : new BigDecimal(amountObj.toString());
        
        // Simulate payment processing
        // In production, this would call: serviceProperties.getPayment().getGateway()
        // with API key: serviceProperties.getPayment().getApiKey()
        boolean success = true; // Simulate successful payment
        
        String transactionId = "TXN-" + UUID.randomUUID().toString().substring(0, 12).toUpperCase();
        String currency = serviceProperties.getPayment().getCurrency();
        
        logger.info("Payment {} for order {}: Transaction ID {}, Currency: {}", 
            success ? "successful" : "failed", orderId, transactionId, currency);
        
        integrationContext.addOutBoundVariable("success", success);
        integrationContext.addOutBoundVariable("status", success ? "COMPLETED" : "FAILED");
        integrationContext.addOutBoundVariable("transactionDetails", Map.of(
            "transactionId", transactionId,
            "amount", amount,
            "currency", currency,
            "gateway", serviceProperties.getPayment().getGateway(),
            "timestamp", new Date()
        ));
        
        return integrationContext;
    }
}
