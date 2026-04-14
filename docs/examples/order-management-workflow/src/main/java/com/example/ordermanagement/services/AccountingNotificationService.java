package com.example.ordermanagement.services;

import org.activiti.api.runtime.shared.delegates.JavaDelegator;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

/**
 * Service for notifying the accounting system.
 * 
 * Called by the notifyAccountingTask in the paymentProcess.
 * Sends payment information to the accounting system.
 */
@Component("accountingNotificationService")
public class AccountingNotificationService implements JavaDelegator {

    private static final Logger logger = LoggerFactory.getLogger(AccountingNotificationService.class);

    @Override
    public void execute() {
        logger.info("Notifying accounting system for order: {}", getVariable("orderId"));
        
        String orderId = (String) getVariable("orderId");
        Object amountObj = getVariable("amount");
        BigDecimal amount = amountObj instanceof BigDecimal 
            ? (BigDecimal) amountObj 
            : new BigDecimal(amountObjObj.toString());
        
        // In production, this would send a webhook or API call to the accounting system
        logger.info("Accounting notified for order {} with amount {}", orderId, amount);
        
        Map<String, Object> outputVariables = new HashMap<>();
        outputVariables.put("notified", true);
        outputVariables.put("notifiedAt", new Date());
        
        setVariables(outputVariables);
    }
}
