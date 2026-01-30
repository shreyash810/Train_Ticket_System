
package com.ilp.trainticket.entity;

import jakarta.persistence.*;

@Entity
public class Staff {

 @Id
 @GeneratedValue(strategy = GenerationType.IDENTITY)
 private Long id;

 private String name;
 private String department;
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
public String getDepartment() {
    return department;
}
public void setDepartment(String department) {
    this.department = department;
}
public String getEmail() {
    return email;
}
public void setEmail(String email) {
    this.email = email;
}
private String email;
}
