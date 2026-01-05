describe("Demo: controls (toggle grid/axes/motion)", () => {
  it("toggles UI options and screenshots", () => {
    cy.visit("/?demo=controls&motion=on");
    cy.get("[data-testid=timeline]").should("be.visible");

    cy.screenshot("controls-01-default");

    cy.get("[data-testid=toggle-grid]").click();
    cy.get("[data-testid=toggle-now]").click();
    cy.get("[data-testid=toggle-motion]").click();

    cy.wait(400);
    cy.screenshot("controls-02-toggled");
  });
});
