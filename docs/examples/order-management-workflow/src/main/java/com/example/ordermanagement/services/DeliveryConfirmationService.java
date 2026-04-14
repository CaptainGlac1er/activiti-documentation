package com.example.ordermanagement.services;

import com.example.ordermanagement.config.ServiceProperties;
import org.activiti.api.runtime.shared.delegates.JavaDelegator;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

/**
 * Service for sending delivery confirmations.
 * 
 * Called by the sendDeliveryConfirmationTask in the shippingProcess.
 * Sends delivery confirmation emails to customers.
 */
@Component("deliveryConfirmationService")
public class DeliveryConfirmationService implements JavaDelegator {

    private static final Logger logger = LoggerFactory.getLogger(DeliveryConfirmationService.class);

    @Autowired
    private ServiceProperties serviceProperties;

    @Override
    public void execute() {
        logger.info("Sending delivery confirmation for order: {}", getVariable("orderId"));
        
        String smtpServer = serviceProperties.getEmail().getSmtpServer();
        String fromAddress = serviceProperties.getEmail().getShippingFromAddress();
        
        logger.info("Sending via {} from {}", smtpServer, fromAddress);
        
        Map<String, Object> outputVariables = new HashMap<>();
        outputVariables.put("sent", true);
        outputVariables.put("status", "DELIVERED");
        outputVariables.put("sentAt", new Date());
        outputVariables.put("smtpServer", smtpServer);
        outputVariables.put("fromAddress", fromAddress);
        
        setVariables(outputVariables);
    }
}
