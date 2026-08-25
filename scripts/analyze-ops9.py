#!/usr/bin/env python3
PM = 0.003

buys = [
    (89.95, 867, 78000, "PagoMovil"),
    (199.94, 867, 173372, "PagoMovil"),
    (70.34, 867, 61000, "PagoMovil"),
    (69.19, 867, 60000, "PagoMovil"),
    (69.19, 867, 60000, "PagoMovil"),
    (60.48, 867, 52443, "PagoMovil"),
    (100.33, 867, 87000, "PagoMovil"),
    (149.92, 867, 130000, "PagoMovil"),
    (399.20, 867, 346154, "PagoMovil"),
    (249.50, 867, 216346, "PagoMovil"),
    (81.88, 867, 71000, "PagoMovil"),
    (102.63, 867, 89000, "PagoMovil"),
    (161.45, 867, 140000, "PagoMovil"),
    (76.35, 869, 66316, "PagoMovil"),
    (63.75, 869, 55372, "PagoMovil"),
    (80.59, 869, 70000, "PagoMovil"),
    (69.94, 869, 60748, "PagoMovil"),
    (57.56, 869, 50000, "PagoMovil"),
    (54.94, 868, 47689, "PagoMovil"),
    (40.32, 868, 35000, "PagoMovil"),
    (51.84, 868, 45000, "PagoMovil"),
    (62.09, 868, 53900, "PagoMovil"),
    (76.47, 870, 66500, "PagoMovil"),
    (39.94, 868, 34668, "PagoMovil"),
    (49.90, 867, 43284, "PagoMovil"),
    (42.08, 867, 36501, "PagoMovil"),
    (44.38, 867, 38500, "PagoMovil"),
    (35.73, 867, 31000, "PagoMovil"),
    (35.73, 867, 31000, "PagoMovil"),
    (39.92, 867, 34627, "PagoMovil"),
    (34.94, 867, 30307, "PagoMovil"),
    (38.75, 867, 33612, "PagoMovil"),
    (39.92, 872, 34822, "PagoMovil"),
    (79.84, 872, 69644, "PagoMovil"),
    (49.90, 872, 43528, "PagoMovil"),
    (39.94, 872, 34840, "PagoMovil"),
    (49.94, 872, 43563, "PagoMovil"),
    (34.40, 872, 30000, "PagoMovil"),
    (44.22, 872, 38560, "PagoMovil"),
    (35.94, 872, 31340, "PagoMovil"),
    (36.69, 872, 32000, "PagoMovil"),
    (51.60, 872, 45000, "Bancaribe"),
    (34.40, 872, 30000, "PagoMovil"),
    (41.81, 872, 36467, "PagoMovil"),
    (39.92, 872, 34810, "PagoMovil"),
    (39.92, 872, 34810, "PagoMovil"),
    (389.22, 872, 339400, "PagoMovil"),
    (44.91, 872, 39162, "PagoMovil"),
    (49.90, 872, 43513, "PagoMovil"),
    (41.68, 872, 36345, "PagoMovil"),
    (49.90, 872, 43513, "PagoMovil"),
    (39.92, 872, 34810, "PagoMovil"),
    (34.36, 873, 30000, "PagoMovil"),
    (48.91, 873, 42698, "PagoMovil"),
    (45.81, 873, 40000, "PagoMovil"),
]

sells = [
    (100.23, 888, 89000, "PagoMovil"),
    (67.57, 888, 60000, "PagoMovil"),
    (112.62, 888, 100000, "PagoMovil"),
    (81.16, 888, 72062, "PagoMovil"),
    (67.57, 888, 60000, "PagoMovil"),
    (90.18, 888, 80071, "PagoMovil"),
    (69.82, 888, 62000, "PagoMovil"),
    (225.25, 888, 200000, "PagoMovil"),
    (200.40, 889, 178136, "Banesco"),
    (149.62, 889, 133000, "Banesco"),
    (150.30, 889, 133602, "PagoMovil"),
    (110.22, 889, 97975, "PagoMovil"),
    (100.20, 889, 89068, "PagoMovil"),
    (112.49, 889, 100000, "PagoMovil"),
    (60.06, 889, 53387, "Bancaribe"),
    (562.49, 889, 500000, "Bancaribe"),
    (121.49, 889, 108000, "PagoMovil"),
    (60.45, 890, 53800, "PagoMovil"),
    (1695.66, 885, 1500000, "BDV"),
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

print(f"compras ops={len(buys)} U={bu:.2f} Bs={bbs:,.0f} media={bavg:.2f} feePM={feeb:,.0f}")
print(f"ventas  ops={len(sells)} U={su:.2f} Bs={sbs:,.0f} media={savg:.2f} feePM={fees:,.0f}")
print(f"inv={bu-su:+.2f} caja={sbs-bbs:+,.0f}")
print(f"matched={m:.2f} spread={sp:.2f}")
print(f"bruta={gross:,.0f} (~{gross/bavg:.1f} U)")
print(f"fee={feem:,.0f} neta={net:,.0f} (~{net/bavg:.1f} U)")
print(f"ad={ad:.2f} neta_tras_ad={net/bavg-ad:.1f} U (~{(net/bavg-ad)*bavg:,.0f} Bs)")
print("excluidas compras CANCELLED: 57.66 + 99.94")
print("excluida venta CANCELLED: 86.84 / 77107")
