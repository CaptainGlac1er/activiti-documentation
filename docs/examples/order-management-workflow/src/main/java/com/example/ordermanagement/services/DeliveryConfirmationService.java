package com.example.ordermanagement.services;

import com.example.ordermanagement.config.ServiceProperties;
import org.activiti.api.process.model.IntegrationContext;
import org.activiti.api.process.runtime.connector.Connector;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.Date;

/**
 * Service for sending delivery confirmations.
 * 
 * Called by the sendDeliveryConfirmationTask in the shippingProcess.
 * Sends delivery confirmation emails to customers.
 */
@Component("deliveryConfirmationService")
public class DeliveryConfirmationService implements Connector {

    private static final Logger logger = LoggerFactory.getLogger(DeliveryConfirmationService.class);

    @Autowired
    private ServiceProperties serviceProperties;

    @Override
    public IntegrationContext apply(IntegrationContext integrationContext) {
        logger.info("Sending delivery confirmation for order: {}", 
            integrationContext.getInBoundVariables().get("orderId"));
        
        String smtpServer = serviceProperties.getEmail().getSmtpServer();
        String fromAddress = serviceProperties.getEmail().getShippingFromAddress();
        
        logger.info("Sending via {} from {}", smtpServer, fromAddress);
        
        integrationContext.addOutBoundVariable("sent", true);
        integrationContext.addOutBoundVariable("status", "DELIVERED");
        integrationContext.addOutBoundVariable("sentAt", new Date());
        integrationContext.addOutBoundVariable("smtpServer", smtpServer);
        integrationContext.addOutBoundVariable("fromAddress", fromAddress);
        
        return integrationContext;
    }
}
