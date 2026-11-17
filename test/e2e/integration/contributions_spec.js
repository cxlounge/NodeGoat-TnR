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

  it("Should reject a roth value containing code instead of evaluating it", () => {
    cy.userSignIn();
    cy.visitPage("/contributions");
    cy.get("table")
      .find("input")
      .eq(2)
      .clear()
      .type("process.exit(1)");

    cy.get("button[type='submit']")
      .click();

    // Server must still be alive and report the value as invalid
    cy.contains("Invalid contribution percentages");
  });

  it("Should reject a negative roth value", () => {
    cy.userSignIn();
    cy.visitPage("/contributions");
    cy.get("table")
      .find("input")
      .eq(2)
      .clear()
      .type("-5");

    cy.get("button[type='submit']")
      .click();

    cy.contains("Invalid contribution percentages");
  });
});
