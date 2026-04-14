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
 * Service for checking customer credit scores.
 * 
 * Called by the checkCreditScoreTask in the orderManagementProcess.
 * Validates customer creditworthiness based on order amount and customer history.
 */
@Component("creditScoreService")
public class CreditScoreService implements JavaDelegator {

    private static final Logger logger = LoggerFactory.getLogger(CreditScoreService.class);

    @Autowired
    private ServiceProperties serviceProperties;

    @Override
    public void execute() {
        logger.info("Executing credit score check for order: {}", getVariable("orderId"));
        logger.info("Using credit bureau API: {}", serviceProperties.getCreditBureau().getApiUrl());
        
        String customerId = (String) getVariable("customerId");
        Object orderAmountObj = getVariable("orderAmount");
        BigDecimal orderAmount = orderAmountObj instanceof BigDecimal 
            ? (BigDecimal) orderAmountObj 
            : new BigDecimal(orderAmountObj.toString());
        
        // Simulate credit score check
        int creditScore = calculateCreditScore(customerId, orderAmount);
        int minScore = serviceProperties.getCreditBureau().getMinCreditScore();
        boolean approved = creditScore >= minScore;
        
        logger.info("Credit score: {}, Min required: {}, Approved: {}", creditScore, minScore, approved);
        
        Map<String, Object> outputVariables = new HashMap<>();
        outputVariables.put("score", creditScore);
        outputVariables.put("approved", approved);
        outputVariables.put("minRequiredScore", minScore);
        
        setVariables(outputVariables);
    }
    
    private int calculateCreditScore(String customerId, BigDecimal orderAmount) {
        // In production, this would call: serviceProperties.getCreditBureau().getApiUrl()
        // For demonstration, we use a deterministic calculation
        int baseScore = 700;
        
        // Adjust based on order amount (larger orders = stricter)
        if (orderAmount.compareTo(new BigDecimal("1000")) > 0) {
            baseScore -= 20;
        }
        if (orderAmount.compareTo(new BigDecimal("5000")) > 0) {
            baseScore -= 30;
        }
        
        // Add some variation based on customer ID hash
        int variation = Math.abs(customerId.hashCode()) % 100;
        return baseScore + variation - 50;
    }
}
