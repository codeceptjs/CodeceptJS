#language: de
Funktionalität: Checkout-Prozess
  Um Produkte zu kaufen
  Als Kunde
  Möchte ich in der Lage sein, mehrere Produkte zu kaufen

  @i18n
  Szenariogrundriss: Bestellrabatt
    Angenommen ich habe ein Produkt mit einem Preis von <price>$ in meinem Warenkorb
    Und der Rabatt für Bestellungen über $20 beträgt 10 %
    Wenn ich zur Kasse gehe
    Dann sollte ich den Gesamtpreis von "<total>" $ sehen

    Beispiele:
      | price | total |
      | 10    | 10.0    |
