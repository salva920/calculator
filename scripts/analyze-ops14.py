#!/usr/bin/env python3
PM = 0.003

buys = [
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
]

sells = [
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

print("=== VENTAS COMPLETED (19 ago) ===")
print(f"ops={len(sells)} U={su:.2f} Bs={sbs:,.0f} media={savg:.2f} feePM={fees:,.0f}")
print()
print("=== COMPRAS COMPLETED (20 ago) ===")
print(f"ops={len(buys)} U={bu:.2f} Bs={bbs:,.0f} media={bavg:.2f} feePM={feeb:,.0f}")
print()
print("=== NETO (matched hasta ahora) ===")
print(f"inv={bu - su:+.2f} caja={sbs - bbs:+,.0f}")
print(f"matched={m:.2f} spread={sp:.2f}")
print(f"bruta={gross:,.0f} (~{gross / bavg:.1f} U)")
print(f"fee={feem:,.0f} neta={net:,.0f} (~{net / bavg:.1f} U)")
print(f"ad={ad:.2f} neta_tras_ad={net / bavg - ad:.1f} U (~{(net / bavg - ad) * bavg:,.0f} Bs)")
print()
faltan = su - bu
print(f"Falta recomprar ~{faltan:.2f} USDT (~{faltan * bavg:,.0f} Bs @ media compra actual)")
print("excluidas: venta CANCELLED 168.66; compras CANCELLED 65.99/72.59/54.99/395.94;")
print("ventas CANCELLED/CANCELLED_BY_SYSTEM: 140.10, 81.64, 124.61, 57.62")
