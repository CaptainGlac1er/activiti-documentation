package com.example.ordermanagement.services;

import org.activiti.api.process.model.IntegrationContext;
import org.activiti.api.process.runtime.connector.Connector;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.Date;

/**
 * Service for notifying the accounting system.
 * 
 * Called by the notifyAccountingTask in the paymentProcess.
 * Sends payment information to the accounting system.
 */
@Component("accountingNotificationService")
public class AccountingNotificationService implements Connector {

    private static final Logger logger = LoggerFactory.getLogger(AccountingNotificationService.class);

    @Override
    public IntegrationContext apply(IntegrationContext integrationContext) {
        logger.info("Notifying accounting system for order: {}", 
            integrationContext.getInBoundVariables().get("orderId"));
        
        String orderId = (String) integrationContext.getInBoundVariables().get("orderId");
        Object amountObj = integrationContext.getInBoundVariables().get("amount");
        BigDecimal amount = amountObj instanceof BigDecimal 
            ? (BigDecimal) amountObj 
            : new BigDecimal(amountObj.toString());
        
        // In production, this would send a webhook or API call to the accounting system
        logger.info("Accounting notified for order {} with amount {}", orderId, amount);
        
        integrationContext.addOutBoundVariable("notified", true);
        integrationContext.addOutBoundVariable("notifiedAt", new Date());
        
        return integrationContext;
    }
}
