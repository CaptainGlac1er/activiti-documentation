package com.example.ordermanagement.services;

import com.example.ordermanagement.config.ServiceProperties;
import org.activiti.api.runtime.shared.delegates.JavaDelegator;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * Service for processing payments.
 * 
 * Called by the processPaymentTask in the paymentProcess.
 * Executes payment transaction and returns result.
 */
@Component("paymentProcessingService")
public class PaymentProcessingService implements JavaDelegator {

    private static final Logger logger = LoggerFactory.getLogger(PaymentProcessingService.class);

    @Autowired
    private ServiceProperties serviceProperties;

    @Override
    public void execute() {
        logger.info("Processing payment for order: {}", getVariable("orderId"));
        logger.info("Using payment gateway: {}", serviceProperties.getPayment().getGateway());
        
        String orderId = (String) getVariable("orderId");
        Object amountObj = getVariable("amount");
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
        
        Map<String, Object> outputVariables = new HashMap<>();
        outputVariables.put("success", success);
        outputVariables.put("status", success ? "COMPLETED" : "FAILED");
        outputVariables.put("transactionDetails", Map.of(
            "transactionId", transactionId,
            "amount", amount,
            "currency", currency,
            "gateway", serviceProperties.getPayment().getGateway(),
            "timestamp", new Date()
        ));
        
        setVariables(outputVariables);
    }
}
