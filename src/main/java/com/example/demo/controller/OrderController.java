package com.example.demo.controller;

import com.example.demo.Entity.Order;
import com.example.demo.dto.OrderRequest;
import com.example.demo.service.OrderService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @PostMapping
    public ResponseEntity<Order> createOrder(
            @Valid @RequestBody OrderRequest request,
            Authentication authentication) {

        Order order = orderService.createOrder(
                authentication.getName(), request);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(order);
    }

    @GetMapping
    public List<Order> getAllOrders(
            Authentication authentication) {

        return orderService.getAllOrders(
                authentication.getName());
    }

    @GetMapping("/{id}")
    public Order getOrderById(
            @PathVariable Long id,
            Authentication authentication) {

        return orderService.getOrderById(
                id, authentication.getName());
    }

    @PutMapping("/{id}")
    public Order updateOrder(
            @PathVariable Long id,
            @Valid @RequestBody OrderRequest request,
            Authentication authentication) {

        return orderService.updateOrder(
                id, authentication.getName(), request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteOrder(
            @PathVariable Long id,
            Authentication authentication) {

        orderService.deleteOrder(
                id, authentication.getName());

        return ResponseEntity.noContent().build();
    }
}