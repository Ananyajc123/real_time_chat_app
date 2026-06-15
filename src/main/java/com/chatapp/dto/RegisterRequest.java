package com.chatapp.dto;
import jakarta.validation.constraints.*;
public class RegisterRequest {
    @NotBlank private String username;
    @Email @NotBlank private String email;
    @NotBlank @Size(min=6) private String password;
    public RegisterRequest() {}
    public String getUsername() { return username; } public void setUsername(String v) { this.username=v; }
    public String getEmail() { return email; } public void setEmail(String v) { this.email=v; }
    public String getPassword() { return password; } public void setPassword(String v) { this.password=v; }
}
