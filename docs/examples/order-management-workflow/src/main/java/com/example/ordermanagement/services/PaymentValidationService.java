package com.example.ordermanagement.services;

import org.activiti.api.process.model.IntegrationContext;
import org.activiti.api.process.runtime.connector.Connector;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

/**
 * Service for validating payment methods.
 * 
 * Called by the validatePaymentMethodTask in the paymentProcess.
 * Validates payment information before processing.
 */
@Component("paymentValidationService")
public class PaymentValidationService implements Connector {

    private static final Logger logger = LoggerFactory.getLogger(PaymentValidationService.class);

    @Override
    public IntegrationContext apply(IntegrationContext integrationContext) {
        logger.info("Validating payment method");
        
        String paymentMethod = (String) integrationContext.getInBoundVariables().get("paymentMethod");
        String cardNumber = (String) integrationContext.getInBoundVariables().get("cardNumber");
        
        // Basic validation logic
        boolean isValid = paymentMethod != null && !paymentMethod.isEmpty()
            && cardNumber != null && cardNumber.length() >= 13;
        
        logger.info("Payment validation result: {}", isValid);
        
        integrationContext.addOutBoundVariable("isValid", isValid);
        integrationContext.addOutBoundVariable("errors", isValid ? "" : "Invalid payment information");
        
        return integrationContext;
    }
}
