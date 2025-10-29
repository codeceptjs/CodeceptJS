#language: nl
Functionaliteit: Checkout proces
  Om producten te kopen
  Als klant
  Moet ik in staat zijn om meerdere producten te kopen

  @i18n
  Abstract Scenario: korting bestellen
    Gegeven ik heb een product met een prijs van <price>$ in mijn winkelwagen
    En de korting voor bestellingen van meer dan $20 is 10 %
    Wanneer ik naar de kassa ga
    Dan zou ik de totaalprijs van "<total>" $ moeten zien

    Voorbeelden:
      | price | total |
      | 10    | 10.0    |
