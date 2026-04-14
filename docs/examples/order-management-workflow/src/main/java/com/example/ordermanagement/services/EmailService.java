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
 * Service for sending email notifications.
 * 
 * Called by the sendConfirmationTask in the orderManagementProcess.
 * Sends order confirmation emails to customers.
 */
@Component("emailService")
public class EmailService implements Connector {

    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);

    @Autowired
    private ServiceProperties serviceProperties;

    @Override
    public IntegrationContext apply(IntegrationContext integrationContext) {
        logger.info("Sending email notification");
        
        String recipient = (String) integrationContext.getInBoundVariables().get("recipient");
        String orderId = (String) integrationContext.getInBoundVariables().get("orderId");
        String customerName = (String) integrationContext.getInBoundVariables().get("customerName");
        String template = (String) integrationContext.getInBoundVariables().get("emailTemplate");
        
        String smtpServer = serviceProperties.getEmail().getSmtpServer();
        String fromAddress = serviceProperties.getEmail().getFromAddress();
        
        // In production, this would integrate with an email service (SendGrid, SES, etc.)
        logger.info("Sending {} email from {} via {} to {} for order {}", 
            template, fromAddress, smtpServer, recipient, orderId);
        
        // Simulate email sending
        boolean sent = true;
        
        integrationContext.addOutBoundVariable("emailSent", sent);
        integrationContext.addOutBoundVariable("sentTo", recipient);
        integrationContext.addOutBoundVariable("sentFrom", fromAddress);
        integrationContext.addOutBoundVariable("smtpServer", smtpServer);
        integrationContext.addOutBoundVariable("sentAt", new Date());
        
        return integrationContext;
    }
}
