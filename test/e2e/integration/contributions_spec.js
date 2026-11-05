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

  it("Should not evaluate code submitted in the afterTax field", () => {
    cy.userSignIn();
    cy.visitPage("/contributions");
    cy.get("input[name='afterTax']")
      .invoke("attr", "type", "text")
      .clear()
      .type("process.exit(1)");

    cy.get("button[type='submit']")
      .click();

    // Payload is treated as a non-numeric value and rejected, server stays up
    cy.contains("Invalid contribution percentages");
    cy.url().should("include", "contributions");
  });

  it("Should reject an arithmetic expression in the afterTax field", () => {
    cy.userSignIn();
    cy.visitPage("/contributions");
    cy.get("input[name='afterTax']")
      .invoke("attr", "type", "text")
      .clear()
      .type("(function(){return 5})()");

    cy.get("button[type='submit']")
      .click();

    cy.contains("Invalid contribution percentages");
  });
});
