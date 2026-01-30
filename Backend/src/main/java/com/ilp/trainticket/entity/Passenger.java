
package com.ilp.trainticket.entity;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "passengers")
public class Passenger {

 @Id
 @GeneratedValue(strategy = GenerationType.IDENTITY)
 private Long id;

 private String name;
 private String email;
 private String mobile;
 private String address;
 private String password;
 private LocalDate dob;
 public Long getId() {
    return id;
}
public void setId(Long id) {
    this.id = id;
}
public String getName() {
    return name;
}
public void setName(String name) {
    this.name = name;
}
public String getEmail() {
    return email;
}
public void setEmail(String email) {
    this.email = email;
}
public String getMobile() {
    return mobile;
}
public void setMobile(String mobile) {
    this.mobile = mobile;
}
public String getAddress() {
    return address;
}
public void setAddress(String address) {
    this.address = address;
}
public LocalDate getDob() {
    return dob;
}
public void setDob(LocalDate dob) {
    this.dob = dob;
}
public String getPassword() {
    return password;
}
public void setPassword(String password) {
    this.password = password;
}
}
