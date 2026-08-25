#!/usr/bin/env python3
"""Ciclo 11 ago noche ventas + 12 ago mañana compras."""

PM = 0.003

buys = [
    (22.97, 871, 20000, "PagoMovil"),
    (22.97, 871, 20000, "PagoMovil"),
    (26.41, 871, 23000, "PagoMovil"),
    (22.97, 871, 20000, "PagoMovil"),
    (22.97, 871, 20000, "PagoMovil"),
    (32.44, 871, 28244, "PagoMovil"),
    (29.94, 871, 26068, "PagoMovil"),
    (22.98, 870, 20000, "PagoMovil"),
    (52.86, 870, 46000, "PagoMovil"),
    (26.43, 870, 23000, "PagoMovil"),
    (39.94, 870, 34753, "PagoMovil"),
    (35.62, 870, 31000, "PagoMovil"),
    (34.94, 870, 30402, "PagoMovil"),
    (34.47, 870, 30000, "PagoMovil"),
    (39.07, 870, 34000, "PagoMovil"),
    (45.74, 870, 39799, "PagoMovil"),
    (35.94, 870, 31272, "PagoMovil"),
    (36.77, 870, 32000, "PagoMovil"),
    (59.94, 870, 52159, "PagoMovil"),
    (69.86, 870, 60787, "PagoMovil"),
    (81.32, 873, 71000, "PagoMovil"),
    (59.94, 874, 52362, "PagoMovil"),
    (74.44, 873, 65011, "PagoMovil"),
    (60.44, 873, 52784, "PagoMovil"),
    (93.82, 873, 81942, "PagoMovil"),
    (99.80, 875, 87306, "PagoMovil"),
    (57.15, 875, 50000, "PagoMovil"),
    (57.15, 875, 50000, "PagoMovil"),
    (81.48, 875, 71280, "PagoMovil"),
    (59.94, 875, 52436, "PagoMovil"),
    (188.61, 875, 165000, "PagoMovil"),
    (83.44, 875, 72994, "PagoMovil"),
    (100.59, 875, 88000, "PagoMovil"),
    (109.78, 875, 96032, "PagoMovil"),
    (60.35, 875, 52800, "PagoMovil"),
    (59.94, 875, 52434, "PagoMovil"),
    (99.94, 875, 87425, "Bancaribe"),
    (149.75, 875, 131000, "Bancaribe"),
    (59.94, 875, 52448, "PagoMovil"),
    (60.57, 875, 53000, "PagoMovil"),
    (57.14, 875, 50000, "PagoMovil"),
    (104.79, 875, 91691, "PagoMovil"),
    (79.99, 875, 70000, "PagoMovil"),
    (89.82, 875, 78593, "PagoMovil"),
    (114.28, 875, 99995, "PagoMovil"),
    (87.99, 875, 77000, "Provincial"),
    (69.86, 875, 61107, "PagoMovil"),
    (59.94, 875, 52419, "PagoMovil"),
    (59.94, 875, 52419, "PagoMovil"),
    (102.91, 875, 90000, "PagoMovil"),
    (99.80, 875, 87277, "PagoMovil"),
    (74.94, 874, 65513, "PagoMovil"),
    (57.19, 874, 50000, "PagoMovil"),
    (59.48, 874, 52000, "PagoMovil"),
    (57.19, 874, 50000, "PagoMovil"),
    (89.91, 874, 78600, "PagoMovil"),
    (76.06, 874, 66500, "PagoMovil"),
    (70.92, 874, 62000, "Bancaribe"),
    (108.67, 874, 95000, "Bancaribe"),
    (69.86, 874, 61072, "PagoMovil"),
    (72.86, 874, 63694, "PagoMovil"),
    (68.06, 874, 59500, "PagoMovil"),
    (66.93, 874, 58511, "PagoMovil"),
    (68.63, 874, 60000, "PagoMovil"),
    (57.77, 874, 50503, "PagoMovil"),
    (89.94, 874, 78626, "PagoMovil"),
    (99.94, 873, 87259, "BNC"),
    (14.94, 872, 13034, "PagoMovil"),
]

sells = [
    (65.86, 878, 57826, "PagoMovil"),
    (70.61, 878, 62000, "PagoMovil"),
    (398.63, 878, 350000, "BNC"),
    (68.33, 878, 60000, "PagoMovil"),
    (56.94, 878, 50000, "PagoMovil"),
    (219.81, 878, 193000, "BNC"),
    (56.82, 880, 50000, "Provincial"),
    (110.49, 878, 97000, "PagoMovil"),
    (56.95, 878, 50000, "PagoMovil"),
    (56.95, 878, 50000, "PagoMovil"),
    (56.95, 878, 50000, "PagoMovil"),
    (62.42, 878, 54800, "PagoMovil"),
    (86.00, 878, 75500, "PagoMovil"),
    (68.29, 879, 60000, "PagoMovil"),
    (150.06, 879, 131843, "BNC"),
    (57.06, 879, 50133, "PagoMovil"),
    (182.10, 879, 160000, "PagoMovil"),
    (79.73, 878, 70000, "PagoMovil"),
    (59.23, 878, 52000, "PagoMovil"),
    (400.06, 879, 351613, "Bancaribe"),
    (96.81, 878, 85000, "PagoMovil"),
    (57.00, 878, 50046, "PagoMovil"),
    (170.06, 878, 149313, "PagoMovil"),
    (151.48, 878, 133000, "PagoMovil"),
    (91.11, 878, 80000, "PagoMovil"),
    (68.22, 878, 59900, "PagoMovil"),
    (125.25, 878, 109969, "PagoMovil"),
    (100.06, 878, 87853, "Bancaribe"),
    (125.25, 880, 110207, "PagoMovil"),
    (1143.11, 875, 1000000, "BDV"),
    (9.09, 880, 8000, "PagoMovil"),
    (6.90, 883, 6100, "PagoMovil"),
    (5.66, 883, 5000, "PagoMovil"),
    (5.66, 883, 5000, "PagoMovil"),
]


def is_pm(bank: str) -> bool:
    return "Pago" in bank or bank == "PagoMovil"


def totals(rows):
    u = sum(r[0] for r in rows)
    bs = sum(r[2] for r in rows)
    pm_bs = sum(r[2] for r in rows if is_pm(r[3]))
    return u, bs, bs / u, pm_bs * PM


bu, bbs, b_avg, fee_b = totals(buys)
su, sbs, s_avg, fee_s = totals(sells)
matched = min(bu, su)
spread = s_avg - b_avg
gross_bs = matched * spread
fee_b_m = fee_b * (matched / bu)
fee_s_m = fee_s * (matched / su)
fee_m = fee_b_m + fee_s_m
net_bs = gross_bs - fee_m
ad = bu * 0.2 / 1000

print("=== COMPRAS (12 ago) ===")
print(f"ops={len(buys)}  USDT={bu:.2f}  Bs={bbs:,.0f}  media={b_avg:.2f}")
print(f"fee PM compras={fee_b:,.0f} Bs")
print()
print("=== VENTAS COMPLETED (11 ago noche) ===")
print(f"ops={len(sells)}  USDT={su:.2f}  Bs={sbs:,.0f}  media={s_avg:.2f}")
print(f"fee PM ventas={fee_s:,.0f} Bs")
print("(excluidas CANCELLED: 277.87 + 5.66 = 283.53 USDT)")
print()
print("=== NETO CICLO ===")
print(f"Inventario USDT: {bu - su:+.2f}")
print(f"Diff caja Bs (ventas-compras): {sbs - bbs:+,.0f}")
print(f"Matched={matched:.2f}  spread={spread:.2f} Bs/USDT")
print(f"Ganancia bruta: {gross_bs:,.0f} Bs (~{gross_bs / b_avg:.1f} USDT)")
print(f"Fee PM (proporcional matched): {fee_m:,.0f} Bs")
print(f"Ganancia neta: {net_bs:,.0f} Bs (~{net_bs / b_avg:.1f} USDT @compra)")
print(f"Anuncio Binance ~{ad:.2f} USDT")
print(f"Neto tras anuncio: ~{net_bs / b_avg - ad:.1f} USDT")
