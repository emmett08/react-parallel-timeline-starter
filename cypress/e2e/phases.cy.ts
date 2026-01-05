describe("Demo: phases (status transitions)", () => {
  it("captures thinking→responding transitions", () => {
    cy.visit("/?demo=phases&motion=on");
    cy.get("[data-testid=timeline]").should("be.visible");

    cy.wait(800);
    cy.screenshot("phases-01");

    // Pan drag for the recording
    cy.get("[data-testid=timeline-canvas]").trigger("pointerdown", { pointerId: 1, clientX: 900, clientY: 260 });
    cy.get("[data-testid=timeline-canvas]").trigger("pointermove", { pointerId: 1, clientX: 760, clientY: 260 });
    cy.get("[data-testid=timeline-canvas]").trigger("pointerup", { pointerId: 1 });

    cy.wait(600);
    cy.screenshot("phases-02-panned");
  });
});
