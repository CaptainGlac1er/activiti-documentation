package com.example.ordermanagement.services;

import org.activiti.api.runtime.shared.delegates.JavaDelegator;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

/**
 * Service for validating payment methods.
 * 
 * Called by the validatePaymentMethodTask in the paymentProcess.
 * Validates payment information before processing.
 */
@Component("paymentValidationService")
public class PaymentValidationService implements JavaDelegator {

    private static final Logger logger = LoggerFactory.getLogger(PaymentValidationService.class);

    @Override
    public void execute() {
        logger.info("Validating payment method");
        
        String paymentMethod = (String) getVariable("paymentMethod");
        String cardNumber = (String) getVariable("cardNumber");
        
        // Basic validation logic
        boolean isValid = paymentMethod != null && !paymentMethod.isEmpty()
            && cardNumber != null && cardNumber.length() >= 13;
        
        logger.info("Payment validation result: {}", isValid);
        
        Map<String, Object> outputVariables = new HashMap<>();
        outputVariables.put("isValid", isValid);
        outputVariables.put("errors", isValid ? "" : "Invalid payment information");
        
        setVariables(outputVariables);
    }
}
