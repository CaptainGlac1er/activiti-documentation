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
 * Service for sending email notifications.
 * 
 * Called by the sendConfirmationTask in the orderManagementProcess.
 * Sends order confirmation emails to customers.
 */
@Component("emailService")
public class EmailService implements JavaDelegator {

    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);

    @Autowired
    private ServiceProperties serviceProperties;

    @Override
    public void execute() {
        logger.info("Sending email notification");
        
        String recipient = (String) getVariable("recipient");
        String orderId = (String) getVariable("orderId");
        String customerName = (String) getVariable("customerName");
        String template = (String) getVariable("emailTemplate");
        
        String smtpServer = serviceProperties.getEmail().getSmtpServer();
        String fromAddress = serviceProperties.getEmail().getFromAddress();
        
        // In production, this would integrate with an email service (SendGrid, SES, etc.)
        logger.info("Sending {} email from {} via {} to {} for order {}", 
            template, fromAddress, smtpServer, recipient, orderId);
        
        // Simulate email sending
        boolean sent = true;
        
        Map<String, Object> outputVariables = new HashMap<>();
        outputVariables.put("emailSent", sent);
        outputVariables.put("sentTo", recipient);
        outputVariables.put("sentFrom", fromAddress);
        outputVariables.put("smtpServer", smtpServer);
        outputVariables.put("sentAt", new Date());
        
        setVariables(outputVariables);
    }
}
