package com.example.ordermanagement.services;

import org.activiti.api.runtime.shared.delegates.JavaDelegator;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * Service for generating payment receipts.
 * 
 * Called by the generateReceiptTask in the paymentProcess.
 * Creates receipt documents after successful payment.
 */
@Component("receiptService")
public class ReceiptService implements JavaDelegator {

    private static final Logger logger = LoggerFactory.getLogger(ReceiptService.class);

    @Override
    public void execute() {
        logger.info("Generating receipt for order: {}", getVariable("orderId"));
        
        String orderId = (String) getVariable("orderId");
        String receiptNumber = "RCP-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        String receiptUrl = "https://receipts.company.com/" + receiptNumber + ".pdf";
        
        logger.info("Receipt generated: {}", receiptNumber);
        
        Map<String, Object> outputVariables = new HashMap<>();
        outputVariables.put("receiptId", receiptNumber);
        outputVariables.put("downloadUrl", receiptUrl);
        outputVariables.put("generatedAt", new Date());
        
        setVariables(outputVariables);
    }
}
