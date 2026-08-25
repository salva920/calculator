#!/usr/bin/env python3
"""Ciclo 19-21: ventas 19+20, compras 20+21."""
PM = 0.003

# Ventas 19 ago (ops14) + ventas 20 ago COMPLETED
sells = [
    # 19 ago
    (60.54, 925, 56000, "PagoMovil"),
    (140.55, 925, 130000, "Provincial"),
    (63.79, 925, 59000, "PagoMovil"),
    (129.74, 925, 120000, "Provincial"),
    (88.65, 925, 82000, "Provincial"),
    (57.30, 925, 53000, "PagoMovil"),
    (118.23, 925, 109351, "PagoMovil"),
    (57.30, 925, 53000, "PagoMovil"),
    (64.87, 925, 60000, "Provincial"),
    (73.52, 925, 68000, "PagoMovil"),
    (75.68, 925, 70000, "Provincial"),
    (58.81, 925, 54400, "PagoMovil"),
    (53.88, 928, 50000, "Banesco"),
    (59.27, 928, 55000, "PagoMovil"),
    (53.88, 928, 50000, "PagoMovil"),
    (215.54, 928, 200000, "Banesco"),
    (522.68, 928, 485000, "Banesco"),
    (60.15, 931, 56000, "Banesco"),
    (96.26, 935, 90000, "PagoMovil"),
    (85.06, 935, 79530, "PagoMovil"),
    (80.22, 935, 75000, "PagoMovil"),
    (235.31, 935, 220000, "PagoMovil"),
    (124.89, 934, 116700, "PagoMovil"),
    (165.88, 934, 155000, "PagoMovil"),
    (140.28, 934, 131076, "PagoMovil"),
    (130.26, 934, 121714, "PagoMovil"),
    (107.02, 934, 100000, "PagoMovil"),
    (189.34, 935, 177000, "PagoMovil"),
    (100.20, 934, 93577, "BT"),
    (60.09, 932, 56000, "BDT"),
    (53.65, 932, 50000, "BDT"),
    (200.06, 932, 186436, "BDT"),
    (375.57, 932, 350000, "BDT"),
    (250.50, 932, 233441, "PagoMovil"),
    (2152.13, 929, 2000000, "BDV"),
    # 20 ago noche
    (216.23, 925, 200000, "PagoMovil"),
    (102.71, 925, 95000, "PagoMovil"),
    (68.11, 925, 63000, "PagoMovil"),
    (86.49, 925, 80000, "PagoMovil"),
    (65.06, 925, 60174, "BNC"),
    (300.60, 925, 278025, "PagoMovil"),
    (200.02, 925, 185000, "PagoMovil"),
    (216.23, 925, 200000, "PagoMovil"),
    (68.11, 925, 63000, "BNC"),
    (75.68, 925, 70000, "PagoMovil"),
    (54.05, 925, 50000, "PagoMovil"),
    (59.46, 925, 55000, "Mercantil"),
    (102.71, 925, 95000, "PagoMovil"),
    (108.11, 925, 100000, "PagoMovil"),
    (108.11, 925, 100000, "PagoMovil"),
    (81.08, 925, 75000, "PagoMovil"),
    (60.54, 925, 56000, "PagoMovil"),
    (67.03, 925, 62000, "PagoMovil"),
    (216.23, 925, 200000, "PagoMovil"),
    (54.05, 925, 50000, "PagoMovil"),
    (100.20, 925, 92675, "Mercantil"),
    (100.20, 926, 92775, "PagoMovil"),
    (112.22, 928, 104129, "PagoMovil"),
    (70.14, 928, 65083, "PagoMovil"),
    (56.04, 928, 52000, "PagoMovil"),
]

# Compras 20 (ops14) + Tesoro 86.08 + compras 21
buys = [
    # 20 ago (ops14)
    (882.89, 906, 800000, "BDDT"),
    (55.67, 907, 50499, "PagoMovil"),
    (55.11, 907, 50000, "PagoMovil"),
    (69.50, 907, 63045, "PagoMovil"),
    (55.11, 907, 50000, "PagoMovil"),
    (59.94, 907, 54373, "PagoMovil"),
    (55.76, 907, 50584, "PagoMovil"),
    (60.03, 907, 54460, "PagoMovil"),
    (59.94, 907, 54373, "PagoMovil"),
    (79.84, 907, 72424, "PagoMovil"),
    (59.94, 906, 54303, "PagoMovil"),
    (57.83, 906, 52400, "PagoMovil"),
    (60.70, 906, 55000, "PagoMovil"),
    (70.20, 906, 63600, "PagoMovil"),
    (99.94, 906, 90541, "PagoMovil"),
    (59.94, 903, 54138, "PagoMovil"),
    (55.46, 902, 50000, "PagoMovil"),
    (55.45, 902, 50000, "PagoMovil"),
    (55.45, 902, 50000, "PagoMovil"),
    (55.45, 902, 50000, "PagoMovil"),
    (59.88, 902, 54000, "PagoMovil"),
    (64.31, 902, 57989, "PagoMovil"),
    (64.94, 902, 58557, "PagoMovil"),
    (67.94, 902, 61262, "PagoMovil"),
    (59.94, 902, 54048, "PagoMovil"),
    (56.44, 902, 50900, "PagoMovil"),
    (55.55, 900, 50000, "PagoMovil"),
    # 20 ago extra
    (86.08, 906, 78000, "Tesoro"),
    # 21 ago
    (149.94, 909, 136327, "PagoMovil"),
    (68.63, 909, 62400, "PagoMovil"),
    (100.94, 909, 91776, "PagoMovil"),
    (74.94, 909, 68136, "PagoMovil"),
    (59.94, 912, 54636, "PagoMovil"),
    (54.85, 912, 50000, "PagoMovil"),
    (72.94, 911, 66431, "PagoMovil"),
    (54.89, 911, 50000, "PagoMovil"),
    (99.94, 911, 91021, "PagoMovil"),
    (57.41, 905, 51956, "PagoMovil"),
    (99.80, 908, 90579, "PagoMovil"),
    (100.26, 908, 91000, "PagoMovil"),
    (55.08, 908, 50000, "PagoMovil"),
    (74.92, 908, 68000, "PagoMovil"),
    (399.20, 910, 363396, "PagoMovil"),
    (119.94, 910, 109183, "PagoMovil"),
    (99.94, 912, 91176, "PagoMovil"),
    (90.15, 912, 82246, "PagoMovil"),
    (399.20, 912, 364194, "Mercantil"),
    (194.61, 912, 177545, "Mercantil"),
    (652.19, 912, 595000, "PagoMovil"),
    (500.92, 912, 457000, "PagoMovil"),
    (100.84, 912, 92000, "PagoMovil"),
    (199.94, 912, 182367, "PagoMovil"),
    (197.34, 912, 180000, "PagoMovil"),
    (87.70, 912, 80000, "PagoMovil"),
    (151.29, 912, 138000, "PagoMovil"),
    (99.94, 912, 91156, "PagoMovil"),
    (99.94, 912, 91156, "PagoMovil"),
    (199.94, 912, 182367, "PagoMovil"),
    (131.56, 912, 120000, "PagoMovil"),
    (199.93, 912, 182319, "Mercantil"),
    (87.73, 912, 80000, "PagoMovil"),
    (99.94, 912, 91132, "PagoMovil"),
    (199.94, 912, 182319, "PagoMovil"),
    (104.97, 912, 95719, "PagoMovil"),
    (128.30, 912, 117000, "PagoMovil"),
    (96.81, 912, 88278, "PagoMovil"),
    (109.66, 912, 100000, "PagoMovil"),
    (109.66, 912, 100000, "PagoMovil"),
    (87.66, 913, 80000, "PagoMovil"),
    (88.95, 913, 81177, "PagoMovil"),
    (89.99, 913, 82130, "PagoMovil"),
    (87.66, 913, 80000, "PagoMovil"),
    (87.66, 913, 80000, "PagoMovil"),
    (109.57, 913, 100000, "PagoMovil"),
    (88.75, 913, 81000, "PagoMovil"),
    (87.66, 913, 80000, "PagoMovil"),
    (55.94, 911, 50965, "PagoMovil"),
    (59.94, 909, 54486, "PagoMovil"),
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
m = min(bu, su)
sp = savg - bavg
gross = m * sp
feem = feeb * (m / bu) + fees * (m / su)
net = gross - feem
ad = bu * 0.2 / 1000

print("=== VENTAS COMPLETED (19+20) ===")
print(f"ops={len(sells)} U={su:.2f} Bs={sbs:,.0f} media={savg:.2f} feePM={fees:,.0f}")
print()
print("=== COMPRAS COMPLETED (20+21) ===")
print(f"ops={len(buys)} U={bu:.2f} Bs={bbs:,.0f} media={bavg:.2f} feePM={feeb:,.0f}")
print()
print("=== NETO ===")
print(f"inv={bu - su:+.2f} caja={sbs - bbs:+,.0f}")
print(f"matched={m:.2f} spread={sp:.2f}")
print(f"bruta={gross:,.0f} (~{gross / bavg:.1f} U)")
print(f"fee={feem:,.0f} neta={net:,.0f} (~{net / bavg:.1f} U)")
print(f"ad={ad:.2f} neta_tras_ad={net / bavg - ad:.1f} U (~{(net / bavg - ad) * bavg:,.0f} Bs)")
if bu < su:
    print(f"Falta recomprar ~{su - bu:.2f} USDT")
else:
    print(f"Sobrante inventario ~{bu - su:.2f} USDT / caja {sbs - bbs:+,.0f}")
print("excluida venta CANCELLED_BY_SYSTEM 64.87")
