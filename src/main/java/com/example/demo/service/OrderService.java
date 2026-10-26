package com.example.demo.service;

import com.example.demo.Entity.Order;
import com.example.demo.Entity.User;
import com.example.demo.dto.OrderRequest;
import com.example.demo.repository.OrderRepository;
import com.example.demo.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Locale;

@Service
public class OrderService {

    private final OrderRepository orderRepository;
    private final UserRepository userRepository;

    public OrderService(
            OrderRepository orderRepository,
            UserRepository userRepository) {
        this.orderRepository = orderRepository;
        this.userRepository = userRepository;
    }

    private User findUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED,
                        "User not found"));
    }

    public Order createOrder(
            String email, OrderRequest request) {

        User user = findUser(email);

        Order order = new Order();
        order.setUserId(user.getId());
        order.setProductId(request.getProductId());
        order.setQuantity(request.getQuantity());
        order.setTotalPrice(request.getTotalPrice());

        String status = request.getStatus();
        order.setStatus(status == null
                ? "PENDING"
                : status.toUpperCase(Locale.ROOT));

        return orderRepository.save(order);
    }

    public List<Order> getAllOrders(String email) {
        User user = findUser(email);

        if ("ADMIN".equals(user.getRole())) {
            return orderRepository.findAll();
        }

        return orderRepository.findByUserId(user.getId());
    }

    public Order getOrderById(Long id, String email) {
        User user = findUser(email);

        if ("ADMIN".equals(user.getRole())) {
            return orderRepository.findById(id)
                    .orElseThrow(() -> new ResponseStatusException(
                            HttpStatus.NOT_FOUND,
                            "Order not found"));
        }

        return orderRepository.findByIdAndUserId(
                id, user.getId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Order not found"));
    }

    public Order updateOrder(
            Long id, String email, OrderRequest request) {

        User user = findUser(email);

        Order order = orderRepository.findByIdAndUserId(
                id, user.getId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Order not found"));

        order.setProductId(request.getProductId());
        order.setQuantity(request.getQuantity());
        order.setTotalPrice(request.getTotalPrice());

        if (request.getStatus() != null) {
            order.setStatus(
                    request.getStatus().toUpperCase(Locale.ROOT));
        }

        return orderRepository.save(order);
    }

    public void deleteOrder(Long id, String email) {
        User user = findUser(email);

        Order order = orderRepository.findByIdAndUserId(
                id, user.getId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Order not found"));

        orderRepository.delete(order);
    }
}