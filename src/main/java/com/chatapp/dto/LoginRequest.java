package com.chatapp.dto;
import jakarta.validation.constraints.*;
public class LoginRequest {
    @Email @NotBlank public String email;
    @NotBlank public String password;
    public LoginRequest() {}
    public String getEmail() { return email; } public void setEmail(String v) { this.email=v; }
    public String getPassword() { return password; } public void setPassword(String v) { this.password=v; }
}
