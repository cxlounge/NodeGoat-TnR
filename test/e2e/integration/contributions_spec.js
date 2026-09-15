/// <reference types="Cypress" />

describe("/contributions behaviour", () => {
  "use strict";

  before(() => {
    cy.dbReset();
  });

  afterEach(() => {
    cy.visitPage("/logout");
  });

  it("Should redirect if the user has not logged in", () => {
    cy.visitPage("/contributions");
    cy.url().should("include", "login");
  });

  it("Should be accesible for a logged user", () => {
    cy.userSignIn();
    cy.visitPage("/contributions");
    cy.url().should("include", "contributions");
  });

  it("Should be a table with several inputs", () => {
    cy.userSignIn();
    cy.visitPage("/contributions");
    cy.get("table")
      .find("input")
      .should("have.length", 3);
  });

  it("Should input be modified", () => {
    const value = "12";
    cy.userSignIn();
    cy.visitPage("/contributions");
    cy.get("table")
      .find("input")
      .first()
      .clear()
      .type(value);

    cy.get("button[type='submit']")
      .click();

    cy.get("tbody > tr > td")
      .eq(1)
      .contains(`${value} %`);

    cy.get(".alert-success")
      .should("be.visible");

    cy.url().should("include", "contributions");
  });

  // Security tests: CWE-94 Code Injection prevention (eval() replaced with parseInt())

  it("Should reject JavaScript code injection via preTax field", () => {
    // Attacker attempts to inject JS code where a number is expected.
    // With eval() this would execute; with parseInt() it returns NaN and triggers validation.
    cy.userSignIn();
    cy.visitPage("/contributions");

    cy.get("table").find("input").eq(0).clear().type("process.exit(1)");
    cy.get("table").find("input").eq(1).clear().type("5");
    cy.get("table").find("input").eq(2).clear().type("5");

    cy.get("button[type='submit']").click();

    // The server must respond with a validation error, NOT execute the payload
    cy.get(".alert-danger, .alert-error, [class*='error']")
      .should("be.visible");
    cy.url().should("include", "contributions");
  });

  it("Should reject object expression injection via afterTax field", () => {
    // Attacker tries to inject an object literal that eval() would evaluate to an object.
    // parseInt() returns NaN for non-numeric strings, triggering the validation guard.
    cy.userSignIn();
    cy.visitPage("/contributions");

    cy.get("table").find("input").eq(0).clear().type("5");
    cy.get("table").find("input").eq(1).clear().type("{malicious: true}");
    cy.get("table").find("input").eq(2).clear().type("5");

    cy.get("button[type='submit']").click();

    cy.get(".alert-danger, .alert-error, [class*='error']")
      .should("be.visible");
    cy.url().should("include", "contributions");
  });

  it("Should reject arithmetic expression injection via roth field", () => {
    // eval() would evaluate arithmetic expressions like "1+1" to 2.
    // parseInt() stops at the first non-digit character and ignores trailing operators,
    // but expressions starting with operators or letters return NaN.
    cy.userSignIn();
    cy.visitPage("/contributions");

    cy.get("table").find("input").eq(0).clear().type("5");
    cy.get("table").find("input").eq(1).clear().type("5");
    cy.get("table").find("input").eq(2).clear().type("require('child_process').execSync('id')");

    cy.get("button[type='submit']").click();

    cy.get(".alert-danger, .alert-error, [class*='error']")
      .should("be.visible");
    cy.url().should("include", "contributions");
  });

  it("Should reject negative number bypass attempts", () => {
    // Negative values are explicitly blocked by the existing validation guard.
    cy.userSignIn();
    cy.visitPage("/contributions");

    cy.get("table").find("input").eq(0).clear().type("-1");
    cy.get("table").find("input").eq(1).clear().type("5");
    cy.get("table").find("input").eq(2).clear().type("5");

    cy.get("button[type='submit']").click();

    cy.get(".alert-danger, .alert-error, [class*='error']")
      .should("be.visible");
    cy.url().should("include", "contributions");
  });

  it("Should reject contributions that exceed 30 percent total", () => {
    cy.userSignIn();
    cy.visitPage("/contributions");

    cy.get("table").find("input").eq(0).clear().type("15");
    cy.get("table").find("input").eq(1).clear().type("10");
    cy.get("table").find("input").eq(2).clear().type("10");

    cy.get("button[type='submit']").click();

    cy.get(".alert-danger, .alert-error, [class*='error']")
      .should("be.visible");
    cy.url().should("include", "contributions");
  });

  it("Should accept valid zero contributions", () => {
    cy.userSignIn();
    cy.visitPage("/contributions");

    cy.get("table").find("input").eq(0).clear().type("0");
    cy.get("table").find("input").eq(1).clear().type("0");
    cy.get("table").find("input").eq(2).clear().type("0");

    cy.get("button[type='submit']").click();

    cy.get(".alert-success").should("be.visible");
    cy.url().should("include", "contributions");
  });

  it("Should accept valid contributions that sum to exactly 30 percent", () => {
    cy.userSignIn();
    cy.visitPage("/contributions");

    cy.get("table").find("input").eq(0).clear().type("10");
    cy.get("table").find("input").eq(1).clear().type("10");
    cy.get("table").find("input").eq(2).clear().type("10");

    cy.get("button[type='submit']").click();

    cy.get(".alert-success").should("be.visible");
    cy.url().should("include", "contributions");
  });
});
