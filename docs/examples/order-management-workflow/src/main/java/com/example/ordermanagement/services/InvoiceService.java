package com.example.ordermanagement.services;

import org.activiti.api.runtime.shared.delegates.JavaDelegator;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * Service for generating invoices.
 * 
 * Called by the generateInvoiceTask in the orderManagementProcess.
 * Creates invoice documents and returns invoice number and download URL.
 */
@Component("invoiceService")
public class InvoiceService implements JavaDelegator {

    private static final Logger logger = LoggerFactory.getLogger(InvoiceService.class);

    @Override
    public void execute() {
        logger.info("Generating invoice for order: {}", getVariable("orderId"));
        
        String orderId = (String) getVariable("orderId");
        String customerName = (String) getVariable("customerName");
        Object orderTotalObj = getVariable("orderTotal");
        BigDecimal orderTotal = orderTotalObj instanceof BigDecimal 
            ? (BigDecimal) orderTotalObj 
            : new BigDecimal(orderTotalObj.toString());
        
        // Generate invoice number
        String invoiceNumber = "INV-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        
        // In production, this would create a PDF invoice and store it
        String invoiceUrl = "https://invoices.company.com/" + invoiceNumber + ".pdf";
        
        logger.info("Invoice generated: {} for customer: {}", invoiceNumber, customerName);
        
        Map<String, Object> outputVariables = new HashMap<>();
        outputVariables.put("invoiceId", invoiceNumber);
        outputVariables.put("downloadUrl", invoiceUrl);
        outputVariables.put("invoiceAmount", orderTotal);
        outputVariables.put("invoiceDate", new Date());
        
        setVariables(outputVariables);
    }
}
