package com.example.ordermanagement.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * Configuration properties for external services.
 * Bound to 'services' prefix in application.yml
 */
@Configuration
@ConfigurationProperties(prefix = "services")
public class ServiceProperties {

    private CreditBureau creditBureau = new CreditBureau();
    private Payment payment = new Payment();
    private Inventory inventory = new Inventory();
    private Shipping shipping = new Shipping();
    private Email email = new Email();

    // Getters and Setters
    public CreditBureau getCreditBureau() { return creditBureau; }
    public void setCreditBureau(CreditBureau creditBureau) { this.creditBureau = creditBureau; }
    
    public Payment getPayment() { return payment; }
    public void setPayment(Payment payment) { this.payment = payment; }
    
    public Inventory getInventory() { return inventory; }
    public void setInventory(Inventory inventory) { this.inventory = inventory; }
    
    public Shipping getShipping() { return shipping; }
    public void setShipping(Shipping shipping) { this.shipping = shipping; }
    
    public Email getEmail() { return email; }
    public void setEmail(Email email) { this.email = email; }

    // Nested classes
    public static class CreditBureau {
        private String apiUrl = "https://api.creditbureau.com/v1";
        private int timeout = 30000;
        private int minCreditScore = 650;

        public String getApiUrl() { return apiUrl; }
        public void setApiUrl(String apiUrl) { this.apiUrl = apiUrl; }
        
        public int getTimeout() { return timeout; }
        public void setTimeout(int timeout) { this.timeout = timeout; }
        
        public int getMinCreditScore() { return minCreditScore; }
        public void setMinCreditScore(int minCreditScore) { this.minCreditScore = minCreditScore; }
    }

    public static class Payment {
        private String gateway = "https://api.stripe.com/v1";
        private String apiKey = "${STRIPE_API_KEY:sk_test_placeholder}";
        private int timeout = 30000;
        private String currency = "USD";

        public String getGateway() { return gateway; }
        public void setGateway(String gateway) { this.gateway = gateway; }
        
        public String getApiKey() { return apiKey; }
        public void setApiKey(String apiKey) { this.apiKey = apiKey; }
        
        public int getTimeout() { return timeout; }
        public void setTimeout(int timeout) { this.timeout = timeout; }
        
        public String getCurrency() { return currency; }
        public void setCurrency(String currency) { this.currency = currency; }
    }

    public static class Inventory {
        private String systemUrl = "https://inventory.company.com/api";
        private int minStockThreshold = 10;
        private String reservationTimeout = "PT1H";
        private int maxReservationDays = 7;

        public String getSystemUrl() { return systemUrl; }
        public void setSystemUrl(String systemUrl) { this.systemUrl = systemUrl; }
        
        public int getMinStockThreshold() { return minStockThreshold; }
        public void setMinStockThreshold(int minStockThreshold) { this.minStockThreshold = minStockThreshold; }
        
        public String getReservationTimeout() { return reservationTimeout; }
        public void setReservationTimeout(String reservationTimeout) { this.reservationTimeout = reservationTimeout; }
        
        public int getMaxReservationDays() { return maxReservationDays; }
        public void setMaxReservationDays(int maxReservationDays) { this.maxReservationDays = maxReservationDays; }
    }

    public static class Shipping {
        private String provider = "fedex";
        private String apiUrl = "https://api.fedex.com/v1";
        private String labelFormat = "PDF";
        private String priorityService = "OVERNIGHT";
        private String standardService = "GROUND";

        public String getProvider() { return provider; }
        public void setProvider(String provider) { this.provider = provider; }
        
        public String getApiUrl() { return apiUrl; }
        public void setApiUrl(String apiUrl) { this.apiUrl = apiUrl; }
        
        public String getLabelFormat() { return labelFormat; }
        public void setLabelFormat(String labelFormat) { this.labelFormat = labelFormat; }
        
        public String getPriorityService() { return priorityService; }
        public void setPriorityService(String priorityService) { this.priorityService = priorityService; }
        
        public String getStandardService() { return standardService; }
        public void setStandardService(String standardService) { this.standardService = standardService; }
    }

    public static class Email {
        private String smtpServer = "smtp.company.com";
        private String fromAddress = "orders@company.com";
        private String shippingFromAddress = "shipping@company.com";

        public String getSmtpServer() { return smtpServer; }
        public void setSmtpServer(String smtpServer) { this.smtpServer = smtpServer; }
        
        public String getFromAddress() { return fromAddress; }
        public void setFromAddress(String fromAddress) { this.fromAddress = fromAddress; }
        
        public String getShippingFromAddress() { return shippingFromAddress; }
        public void setShippingFromAddress(String shippingFromAddress) { this.shippingFromAddress = shippingFromAddress; }
    }
}
