#!/usr/bin/env python3
"""Ciclo ventas 12 ago noche + compras 13 ago."""

PM = 0.003
CAPITAL_USER = 6_635_000  # lo que dijo el user

# Compras 13 ago (mismo set analyze-ops6)
buys = [
    (17.16, 880, 15100, "PagoMovil"),
    (16.94, 880, 14899, "PagoMovil"),
    (11.37, 880, 10000, "PagoMovil"),
    (12.50, 880, 11000, "PagoMovil"),
    (19.94, 880, 17537, "PagoMovil"),
    (21.60, 880, 19000, "PagoMovil"),
    (94.31, 880, 83000, "PagoMovil"),
    (99.94, 880, 87949, "PagoMovil"),
    (90.90, 880, 80000, "PagoMovil"),
    (59.43, 880, 52300, "PagoMovil"),
    (59.94, 879, 52688, "PagoMovil"),
    (78.39, 879, 68899, "PagoMovil"),
    (72.86, 879, 64038, "PagoMovil"),
    (69.94, 879, 61472, "PagoMovil"),
    (79.94, 879, 70261, "PagoMovil"),
    (102.39, 879, 90000, "PagoMovil"),
    (64.94, 877, 56963, "PagoMovil"),
    (97.41, 877, 85444, "PagoMovil"),
    (69.94, 877, 61349, "PagoMovil"),
    (99.80, 877, 87541, "PagoMovil"),
    (59.94, 877, 52577, "PagoMovil"),
    (100.66, 877, 88300, "PagoMovil"),
    (99.80, 877, 87541, "Banesco"),
    (79.84, 877, 69989, "PagoMovil"),
    (60.64, 876, 53100, "PagoMovil"),
    (59.94, 876, 52484, "PagoMovil"),
    (64.94, 876, 56901, "PagoMovil"),
    (57.06, 876, 50000, "PagoMovil"),
    (68.94, 876, 60406, "PagoMovil"),
    (57.94, 876, 50768, "PagoMovil"),
    (57.06, 876, 50000, "PagoMovil"),
    (57.06, 876, 50000, "PagoMovil"),
    (57.06, 876, 50000, "PagoMovil"),
    (57.06, 876, 50000, "PagoMovil"),
    (96.17, 876, 84200, "PagoMovil"),
    (228.43, 876, 200000, "PagoMovil"),
    (99.99, 876, 87550, "PagoMovil"),
    (102.79, 876, 90000, "PagoMovil"),
    (99.94, 876, 87498, "PagoMovil"),
    (99.37, 876, 87000, "PagoMovil"),
    (59.94, 875, 52420, "PagoMovil"),
    (72.03, 875, 63000, "PagoMovil"),
    (57.17, 875, 50000, "PagoMovil"),
    (59.94, 875, 52419, "PagoMovil"),
    (64.09, 874, 56000, "PagoMovil"),
    (64.94, 874, 56739, "PagoMovil"),
    (59.94, 872, 52277, "PagoMovil"),
    (97.81, 872, 85297, "PagoMovil"),
    (94.94, 872, 82794, "PagoMovil"),
    (98.48, 873, 86000, "PagoMovil"),
    (154.69, 873, 135086, "PagoMovil"),
    (99.94, 874, 87339, "PagoMovil"),
    (199.94, 874, 174730, "PagoMovil"),
    (199.94, 874, 174730, "PagoMovil"),
    (147.94, 874, 129286, "PagoMovil"),
    (99.94, 874, 87339, "PagoMovil"),
    (100.01, 874, 87400, "BANK"),
    (99.94, 874, 87339, "PagoMovil"),
    (99.94, 874, 87339, "PagoMovil"),
    (152.94, 874, 133656, "PagoMovil"),
    (184.22, 874, 161000, "PagoMovil"),
    (113.13, 875, 99000, "PagoMovil"),
    (397.94, 874, 347923, "PagoMovil"),
    (101.22, 874, 88500, "PagoMovil"),
    (164.94, 874, 144209, "PagoMovil"),
    (74.96, 874, 65482, "PagoMovil"),
    (85.85, 874, 75000, "PagoMovil"),
    (68.68, 874, 60000, "Mercantil"),
    (72.11, 874, 63000, "PagoMovil"),
    (178.94, 871, 155857, "PagoMovil"),
    (99.94, 871, 87048, "PagoMovil"),
    (79.84, 871, 69541, "PagoMovil"),
    (85.69, 872, 74722, "PagoMovil"),
    (59.94, 879, 52712, "PagoMovil"),
    (87.85, 879, 77259, "PagoMovil"),
    (93.94, 879, 82612, "PagoMovil"),
    (77.33, 878, 67873, "PagoMovil"),
    (119.76, 878, 105115, "PagoMovil"),
    (99.80, 878, 87595, "PagoMovil"),
    (61.54, 878, 54014, "PagoMovil"),
    (72.94, 878, 64020, "PagoMovil"),
    (79.94, 879, 70236, "PagoMovil"),
    (85.83, 879, 75411, "PagoMovil"),
    (121.76, 879, 106980, "PagoMovil"),
    (71.94, 879, 63207, "PagoMovil"),
    (57.94, 878, 50855, "PagoMovil"),
    (56.94, 878, 50000, "PagoMovil"),
    (59.87, 879, 52600, "BNC"),
    (56.91, 879, 50000, "PagoMovil"),
    (56.91, 879, 50000, "PagoMovil"),
    (25.04, 878, 22000, "PagoMovil"),
    (25.04, 878, 22000, "PagoMovil"),
    (30.73, 878, 27000, "PagoMovil"),
]

# Ventas COMPLETED only (excluye CANCELLED / CANCELLED_BY_SYSTEM)
# última fila sin estado explícito → COMPLETED
sells = [
    (492.06, 890, 437892, "Bancamiga"),
    (56.18, 890, 50000, "Bancamiga"),
    (56.25, 889, 50000, "PagoMovil"),
    (393.78, 889, 350000, "Bancamiga"),
    (104.54, 887, 92712, "PagoMovil"),
    (60.06, 887, 53261, "PagoMovil"),
    (75.15, 887, 66643, "PagoMovil"),
    (90.18, 887, 79972, "PagoMovil"),
    (67.65, 887, 60000, "PagoMovil"),
    (99.23, 887, 88000, "PagoMovil"),
    (134.10, 886, 118800, "PagoMovil"),
    (96.85, 886, 85800, "PagoMovil"),
    (170.34, 886, 150904, "PagoMovil"),
    (100.20, 886, 88767, "PagoMovil"),
    (100.46, 886, 89000, "PagoMovil"),
    (112.87, 886, 100000, "PagoMovil"),
    (56.43, 886, 50000, "Provincial"),
    (112.87, 886, 100000, "PagoMovil"),
    (80.16, 886, 71014, "Provincial"),
    (112.87, 886, 100000, "Provincial"),
    (79.01, 886, 70000, "PagoMovil"),
    (56.43, 886, 50000, "Provincial"),
    (225.75, 886, 200000, "Provincial"),
    (75.43, 885, 66748, "PagoMovil"),
    (76.84, 885, 68000, "Mercantil"),
    (415.86, 885, 368000, "Mercantil"),
    (100.57, 885, 89000, "PagoMovil"),
    (91.53, 885, 81000, "PagoMovil"),
    (1701.04, 882, 1500000, "BDV"),
    (226.01, 885, 200000, "Banesco"),
    (60.45, 885, 53500, "PagoMovil"),
    (70.06, 885, 61996, "PagoMovil"),
    (113.00, 885, 100000, "Banesco"),
    (180.81, 885, 160000, "PagoMovil"),
    (565.67, 884, 500000, "BNC"),
    (148.12, 884, 130900, "BNC"),
    (60.06, 883, 53027, "BNC"),
    (99.67, 883, 88000, "Banesco"),
    (77.01, 883, 68000, "Banesco"),
    (295.61, 883, 261000, "Banesco"),
    (700.06, 883, 618083, "BNC"),
]


def is_pm(b):
    return "Pago" in b


def tot(rows):
    u = sum(r[0] for r in rows)
    bs = sum(r[2] for r in rows)
    pm = sum(r[2] for r in rows if is_pm(r[3]))
    return u, bs, bs / u, pm * PM


bu, bbs, bavg, feeb = tot(buys)
su, sbs, savg, fees = tot(sells)
matched = min(bu, su)
spread = savg - bavg
gross = matched * spread
feeb_m = feeb * (matched / bu)
fees_m = fees * (matched / su)
fee_m = feeb_m + fees_m
net = gross - fee_m
ad = bu * 0.2 / 1000
inv = bu - su
caja = sbs - bbs

print("=== VENTAS COMPLETED (12 ago) ===")
print(f"ops={len(sells)} USDT={su:.2f} Bs={sbs:,.0f} media={savg:.2f}")
print(f"fee PM ventas={fees:,.0f}")
print()
print("=== COMPRAS (13 ago) ===")
print(f"ops={len(buys)} USDT={bu:.2f} Bs={bbs:,.0f} media={bavg:.2f}")
print(f"fee PM compras={feeb:,.0f}")
print()
print("=== NETO CICLO ===")
print(f"Inventario USDT: {inv:+.2f}")
print(f"Diff caja Bs (ventas-compras): {caja:+,.0f}")
print(f"Matched={matched:.2f} spread={spread:.2f}")
print(f"Bruta={gross:,.0f} Bs (~{gross/bavg:.1f} USDT)")
print(f"Fee PM matched={fee_m:,.0f} Bs")
print(f"Neta={net:,.0f} Bs (~{net/bavg:.1f} USDT @compra / {net/savg:.1f} @venta)")
print(f"Anuncio~{ad:.2f} USDT")
print(f"Neta tras anuncio~{net/bavg - ad:.1f} USDT (~{(net/bavg - ad)*bavg:,.0f} Bs)")
print()
print(f"User dijo capital={CAPITAL_USER:,.0f}")
print(f"Ventas reales Bs={sbs:,.0f}  (diff vs user: {sbs - CAPITAL_USER:+,.0f})")
print(f"Compras - ventas Bs = {-caja:,.0f}  (extra metido en recompra)")
