package com.example.ordermanagement.services;

import org.activiti.api.process.model.IntegrationContext;
import org.activiti.api.process.runtime.connector.Connector;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.Date;
import java.util.UUID;

/**
 * Service for generating invoices.
 * 
 * Called by the generateInvoiceTask in the orderManagementProcess.
 * Creates invoice documents and returns invoice number and download URL.
 */
@Component("invoiceService")
public class InvoiceService implements Connector {

    private static final Logger logger = LoggerFactory.getLogger(InvoiceService.class);

    @Override
    public IntegrationContext apply(IntegrationContext integrationContext) {
        logger.info("Generating invoice for order: {}", 
            integrationContext.getInBoundVariables().get("orderId"));
        
        String orderId = (String) integrationContext.getInBoundVariables().get("orderId");
        String customerName = (String) integrationContext.getInBoundVariables().get("customerName");
        Object orderTotalObj = integrationContext.getInBoundVariables().get("orderTotal");
        BigDecimal orderTotal = orderTotalObj instanceof BigDecimal 
            ? (BigDecimal) orderTotalObj 
            : new BigDecimal(orderTotalObj.toString());
        
        // Generate invoice number
        String invoiceNumber = "INV-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        
        // In production, this would create a PDF invoice and store it
        String invoiceUrl = "https://invoices.company.com/" + invoiceNumber + ".pdf";
        
        logger.info("Invoice generated: {} for customer: {}", invoiceNumber, customerName);
        
        integrationContext.addOutBoundVariable("invoiceId", invoiceNumber);
        integrationContext.addOutBoundVariable("downloadUrl", invoiceUrl);
        integrationContext.addOutBoundVariable("invoiceAmount", orderTotal);
        integrationContext.addOutBoundVariable("invoiceDate", new Date());
        
        return integrationContext;
    }
}
