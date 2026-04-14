package com.example.ordermanagement.controllers;

import org.activiti.api.process.model.ProcessInstance;
import org.activiti.api.process.runtime.ProcessRuntime;
import org.activiti.api.process.runtime.ProcessPayloadBuilder;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * REST controller for order management workflow operations.
 * 
 * Provides endpoints to:
 * - Start new order processes
 * - Query process instances
 * - Get process status
 */
@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private static final Logger logger = LoggerFactory.getLogger(OrderController.class);

    @Autowired
    private ProcessRuntime processRuntime;

    /**
     * Start a new order management process.
     * 
     * @param request The order start request
     * @return The created process instance
     */
    @PostMapping
    public ResponseEntity<Map<String, Object>> startOrder(@RequestBody StartOrderRequest request) {
        logger.info("Starting order process for: {}", request.getOrderId());
        
        Map<String, Object> variables = new HashMap<>();
        variables.put("orderId", request.getOrderId());
        variables.put("customerName", request.getCustomerName());
        variables.put("customerEmail", request.getCustomerEmail());
        variables.put("orderTotal", request.getOrderTotal());
        variables.put("orderItems", request.getOrderItems());
        variables.put("customerAddress", request.getCustomerAddress());
        variables.put("selectedShippingMethod", request.getShippingMethod());
        
        ProcessInstance processInstance = processRuntime.start(
            ProcessPayloadBuilder.start()
                .withProcessDefinitionKey("orderManagementProcess")
                .withBusinessKey(request.getOrderId())
                .withVariables(variables)
                .build()
        );
        
        logger.info("Order process started: ID={}, BusinessKey={}", 
            processInstance.getId(), processInstance.getBusinessKey());
        
        Map<String, Object> response = new HashMap<>();
        response.put("processInstanceId", processInstance.getId());
        response.put("orderId", request.getOrderId());
        response.put("status", processInstance.getStatus());
        
        return ResponseEntity.ok(response);
    }

    /**
     * Get order process instance details.
     * 
     * @param orderId The order ID (business key)
     * @return Process instance details
     */
    @GetMapping("/{orderId}")
    public ResponseEntity<ProcessInstance> getOrderStatus(@PathVariable String orderId) {
        // Note: In production, you'd query by business key
        logger.info("Getting status for order: {}", orderId);
        
        return ResponseEntity.ok(null); // Placeholder - implement proper query
    }
}

/**
 * Request DTO for starting an order.
 */
class StartOrderRequest {
    private String orderId;
    private String customerName;
    private String customerEmail;
    private BigDecimal orderTotal;
    private Object orderItems;
    private Object customerAddress;
    private String shippingMethod = "STANDARD";
    
    // Getters and setters
    public String getOrderId() { return orderId; }
    public void setOrderId(String orderId) { this.orderId = orderId; }
    public String getCustomerName() { return customerName; }
    public void setCustomerName(String customerName) { this.customerName = customerName; }
    public String getCustomerEmail() { return customerEmail; }
    public void setCustomerEmail(String customerEmail) { this.customerEmail = customerEmail; }
    public BigDecimal getOrderTotal() { return orderTotal; }
    public void setOrderTotal(BigDecimal orderTotal) { this.orderTotal = orderTotal; }
    public Object getOrderItems() { return orderItems; }
    public void setOrderItems(Object orderItems) { this.orderItems = orderItems; }
    public Object getCustomerAddress() { return customerAddress; }
    public void setCustomerAddress(Object customerAddress) { this.customerAddress = customerAddress; }
    public String getShippingMethod() { return shippingMethod; }
    public void setShippingMethod(String shippingMethod) { this.shippingMethod = shippingMethod; }
}
