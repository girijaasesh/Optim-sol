package com.agilepro.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
@Slf4j
public class CurrencyService {

    // Static fallback rates (USD base). In production replace with
    // a scheduled job that fetches from Open Exchange Rates API.
    private static final Map<String, BigDecimal> RATES = new ConcurrentHashMap<>(Map.of(
        "USD", BigDecimal.ONE,
        "AUD", new BigDecimal("1.53"),
        "GBP", new BigDecimal("0.79"),
        "CAD", new BigDecimal("1.36"),
        "INR", new BigDecimal("83.20"),
        "EUR", new BigDecimal("0.92"),
        "SGD", new BigDecimal("1.34"),
        "NZD", new BigDecimal("1.64")
    ));

    public BigDecimal getRate(String currency) {
        if (currency == null) return BigDecimal.ONE;
        return RATES.getOrDefault(currency.toUpperCase(), BigDecimal.ONE);
    }

    public Map<String, BigDecimal> getAllRates() {
        return Map.copyOf(RATES);
    }
}
