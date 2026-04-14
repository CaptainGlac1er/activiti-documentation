package com.example.ordermanagement.services;

import org.activiti.api.process.model.IntegrationContext;
import org.activiti.api.process.runtime.connector.Connector;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.Date;
import java.util.UUID;

/**
 * Service for generating payment receipts.
 * 
 * Called by the generateReceiptTask in the paymentProcess.
 * Creates receipt documents after successful payment.
 */
@Component("receiptService")
public class ReceiptService implements Connector {

    private static final Logger logger = LoggerFactory.getLogger(ReceiptService.class);

    @Override
    public IntegrationContext apply(IntegrationContext integrationContext) {
        logger.info("Generating receipt for order: {}", 
            integrationContext.getInBoundVariables().get("orderId"));
        
        String orderId = (String) integrationContext.getInBoundVariables().get("orderId");
        String receiptNumber = "RCP-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        String receiptUrl = "https://receipts.company.com/" + receiptNumber + ".pdf";
        
        logger.info("Receipt generated: {}", receiptNumber);
        
        integrationContext.addOutBoundVariable("receiptId", receiptNumber);
        integrationContext.addOutBoundVariable("downloadUrl", receiptUrl);
        integrationContext.addOutBoundVariable("generatedAt", new Date());
        
        return integrationContext;
    }
}
