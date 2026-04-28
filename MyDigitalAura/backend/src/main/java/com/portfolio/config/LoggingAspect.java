package com.portfolio.config;

import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

@Aspect
@Component
public class LoggingAspect {

    private static final Logger log = LoggerFactory.getLogger(LoggingAspect.class);

    @Around("execution(* com.portfolio.controller.*.*(..))")
    public Object logControllerMethods(ProceedingJoinPoint joinPoint) throws Throwable {
        String method = joinPoint.getSignature().toShortString();
        log.info("→ Entering: {}", method);
        long start = System.currentTimeMillis();
        try {
            Object result = joinPoint.proceed();
            log.info("← Exiting: {} ({}ms)", method, System.currentTimeMillis() - start);
            return result;
        } catch (Exception ex) {
            log.error("✗ Exception in {}: {}", method, ex.getMessage());
            throw ex;
        }
    }
}
