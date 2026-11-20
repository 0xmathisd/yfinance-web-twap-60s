# Yahoo Finance – Live TWAP Indicator

A lightweight JavaScript userscript that adds a live 60-second Time-Weighted Average Price (TWAP) indicator directly next to the price on Yahoo Finance.

Designed for Chrome, DevTools Console and Tampermonkey.

## Features

- **Live TWAP 60s:** Rolling 60-second Time-Weighted Average Price.
- **Time-weighted calculation:** Each observed price is weighted by the time it remains unchanged.
- **Automatic price detection:** Detects Yahoo Finance's current price dynamically.
- **Non-invasive integration:** Preserves Yahoo's original price and daily change statistics.
- **Price deviation:** Displays the absolute and percentage difference between the current price and TWAP.
- **Color indicators:** Green when the current price is above TWAP, red when below.
- **Two-decimal formatting:** Consistent price and deviation formatting.
- **Automatic DOM detection:** Handles dynamically rendered Yahoo Finance elements.

## Preview

The TWAP indicator appears directly to the right of Yahoo Finance's original price statistics.

```text
ETH-USD

$1,745.53     TWAP 60s
              $1,745.44
              +$0.09 (+0.01%)
```

*Illustrative values.*

## Installation

### Option 1 – Chrome DevTools Console

1. Open a Yahoo Finance quote page.
2. Press `F12` to open Developer Tools.
3. Navigate to the Console tab.
4. Copy the contents of `src/yahoo-twap-console.js`.
5. Paste and execute the script.

To stop the indicator, execute:

```javascript
__twapStop()
```

### Option 2 – Tampermonkey

1. Install [Tampermonkey](https://www.tampermonkey.net/).
2. Open the Tampermonkey dashboard.
3. Select **Create a new script**.
4. Copy the contents of `src/yahoo-twap.user.js`.
5. Save the script.
6. Open or refresh a Yahoo Finance quote page.

Supported URL pattern:

`https://finance.yahoo.com/quote/*`

## Calculation

The indicator calculates a rolling 60-second TWAP based on observed Yahoo Finance price updates.

\[
TWAP_{60s} = \frac{\sum_{i=1}^{n} P_i \times \Delta t_i}{60}
\]

Where:

- \(P_i\): Observed market price.
- \(\Delta t_i\): Duration during which that price remains unchanged.
- \(n\): Number of price observations within the rolling window.

### Price deviation

The indicator also calculates the difference between the current price and the TWAP.

**Absolute deviation:**

\[
Deviation = Price - TWAP
\]

**Percentage deviation:**

\[
Deviation(\%) = \frac{Price - TWAP}{TWAP} \times 100
\]

### Color interpretation

| Condition | Color |
|---|---|
| Price above TWAP | 🟢 Green |
| Price below TWAP | 🔴 Red |
| Initial data collection | Grey |

The initial TWAP requires 60 seconds of collected observations.

## Project Structure

```text
yahoo-finance-twap/
│
├── README.md
├── LICENSE
│
└── src/
    ├── yahoo-twap-console.js
    └── yahoo-twap.user.js
```

## Technical Details

- Language: JavaScript
- Platform: Yahoo Finance
- Browser: Chrome / Chromium
- Userscript manager: Tampermonkey
- Update detection interval: 500 ms
- TWAP rolling window: 60 seconds

## Limitations

- The indicator uses prices displayed by Yahoo Finance, not individual exchange trades.
- Accuracy depends on Yahoo Finance's price refresh frequency.
- Repeated identical prices are not stored as separate observations.
- The last observed price remains active until Yahoo provides a new price.
- The TWAP is not volume-weighted.
- Timestamps are based on the local browser clock.

This is an observed-price TWAP, not an exchange-level transaction TWAP.

## Disclaimer

This project is an independent browser-side tool and is not affiliated with, endorsed by, or sponsored by Yahoo Finance.

Market data availability and refresh frequency are controlled by Yahoo Finance.

## License

MIT License.
