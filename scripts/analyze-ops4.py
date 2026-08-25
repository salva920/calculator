# -*- coding: utf-8 -*-
import re
from collections import defaultdict

RAW = r'''
Compra
COMPLETED
05/08/26, 10:05 a. m.
Cantidad
89.94 USDT
Total Bs.S
Bs.S 75.218
Banco
PagoMovil
Compra
COMPLETED
05/08/26, 10:04 a. m.
Cantidad
179.94 USDT
Total Bs.S
Bs.S 150.486
Banco
PagoMovil
Compra
COMPLETED
05/08/26, 10:04 a. m.
Cantidad
95.65 USDT
Total Bs.S
Bs.S 80.000
Banco
PagoMovil
Compra
COMPLETED
05/08/26, 10:03 a. m.
Cantidad
205.66 USDT
Total Bs.S
Bs.S 172.000
Banco
PagoMovil
Compra
COMPLETED
05/08/26, 10:03 a. m.
Cantidad
89.67 USDT
Total Bs.S
Bs.S 75.000
Banco
PagoMovil
Compra
COMPLETED
05/08/26, 10:02 a. m.
Cantidad
99.94 USDT
Total Bs.S
Bs.S 83.581
Banco
PagoMovil
Compra
COMPLETED
05/08/26, 10:02 a. m.
Cantidad
99.94 USDT
Total Bs.S
Bs.S 83.581
Banco
PagoMovil
Compra
COMPLETED
05/08/26, 09:59 a. m.
Cantidad
71.76 USDT
Total Bs.S
Bs.S 60.000
Banco
PagoMovil
Compra
COMPLETED
05/08/26, 09:40 a. m.
Cantidad
99.80 USDT
Total Bs.S
Bs.S 83.304
Banco
PagoMovil
Compra
COMPLETED
05/08/26, 09:40 a. m.
Cantidad
99.80 USDT
Total Bs.S
Bs.S 83.304
Banco
PagoMovil
Compra
COMPLETED
05/08/26, 09:33 a. m.
Cantidad
59.90 USDT
Total Bs.S
Bs.S 50.000
Banco
PagoMovil
Compra
COMPLETED
05/08/26, 09:25 a. m.
Cantidad
65.94 USDT
Total Bs.S
Bs.S 54.902
Banco
PagoMovil
Compra
COMPLETED
05/08/26, 09:24 a. m.
Cantidad
77.85 USDT
Total Bs.S
Bs.S 64.819
Banco
PagoMovil
Compra
COMPLETED
05/08/26, 09:00 a. m.
Cantidad
142.32 USDT
Total Bs.S
Bs.S 118.912
Banco
Provincial
Compra
COMPLETED
05/08/26, 09:00 a. m.
Cantidad
113.17 USDT
Total Bs.S
Bs.S 94.555
Banco
Provincial
Compra
COMPLETED
05/08/26, 09:00 a. m.
Cantidad
908.42 USDT
Total Bs.S
Bs.S 759.000
Banco
Provincial
Compra
BUYER_PAYED
05/08/26, 09:00 a. m.
Cantidad
497.89 USDT
Total Bs.S
Bs.S 416.000
Banco
Mercantil
Compra
COMPLETED
05/08/26, 09:00 a. m.
Cantidad
468.14 USDT
Total Bs.S
Bs.S 391.699
Banco
Provincial
Compra
COMPLETED
05/08/26, 09:00 a. m.
Cantidad
454.15 USDT
Total Bs.S
Bs.S 380.000
Banco
Provincial
Compra
COMPLETED
05/08/26, 08:59 a. m.
Cantidad
603.55 USDT
Total Bs.S
Bs.S 505.000
Banco
Provincial
Compra
COMPLETED
05/08/26, 08:59 a. m.
Cantidad
119.88 USDT
Total Bs.S
Bs.S 100.305
Banco
Provincial
Compra
COMPLETED
05/08/26, 08:58 a. m.
Cantidad
59.75 USDT
Total Bs.S
Bs.S 50.000
Banco
BNCBancoNacional
Compra
COMPLETED
05/08/26, 08:56 a. m.
Cantidad
452.94 USDT
Total Bs.S
Bs.S 378.979
Banco
Provincial
Compra
COMPLETED
05/08/26, 08:53 a. m.
Cantidad
83.66 USDT
Total Bs.S
Bs.S 70.000
Banco
PagoMovil
Compra
COMPLETED
05/08/26, 08:53 a. m.
Cantidad
64.94 USDT
Total Bs.S
Bs.S 54.336
Banco
PagoMovil
Compra
COMPLETED
05/08/26, 08:53 a. m.
Cantidad
99.50 USDT
Total Bs.S
Bs.S 83.253
Banco
PagoMovil
Compra
COMPLETED
05/08/26, 08:52 a. m.
Cantidad
69.94 USDT
Total Bs.S
Bs.S 58.519
Banco
PagoMovil
Compra
COMPLETED
05/08/26, 08:52 a. m.
Cantidad
59.75 USDT
Total Bs.S
Bs.S 50.000
Banco
PagoMovil
Compra
COMPLETED
05/08/26, 08:52 a. m.
Cantidad
99.80 USDT
Total Bs.S
Bs.S 83.504
Banco
PagoMovil
Compra
COMPLETED
05/08/26, 08:52 a. m.
Cantidad
99.94 USDT
Total Bs.S
Bs.S 83.621
Banco
PagoMovil
Compra
COMPLETED
05/08/26, 08:51 a. m.
Cantidad
71.70 USDT
Total Bs.S
Bs.S 60.000
Banco
Mercantil
Compra
COMPLETED
05/08/26, 08:51 a. m.
Cantidad
59.75 USDT
Total Bs.S
Bs.S 50.000
Banco
PagoMovil
Venta
COMPLETED
04/08/26, 08:56 p. m.
Cantidad
2367.53 USDT
Total Bs.S
Bs.S 2.000.000
Banco
BancoDeVenezuela
Compra
COMPLETED
04/08/26, 08:52 p. m.
Cantidad
8.96 USDT
Total Bs.S
Bs.S 7.500
Banco
PagoMovil
Compra
COMPLETED
04/08/26, 08:51 p. m.
Cantidad
9.98 USDT
Total Bs.S
Bs.S 8.345
Banco
PagoMovil
Venta
COMPLETED
04/08/26, 05:20 p. m.
Cantidad
222.76 USDT
Total Bs.S
Bs.S 190.000
Banco
Bancaribe
Venta
COMPLETED
04/08/26, 04:44 p. m.
Cantidad
85.17 USDT
Total Bs.S
Bs.S 72.641
Banco
Banesco
Venta
COMPLETED
04/08/26, 04:39 p. m.
Cantidad
76.21 USDT
Total Bs.S
Bs.S 65.000
Banco
PagoMovil
Venta
COMPLETED
04/08/26, 04:17 p. m.
Cantidad
117.10 USDT
Total Bs.S
Bs.S 100.000
Banco
Banesco
Venta
COMPLETED
04/08/26, 04:10 p. m.
Cantidad
60.96 USDT
Total Bs.S
Bs.S 52.000
Banco
Banesco
Venta
COMPLETED
04/08/26, 03:40 p. m.
Cantidad
73.79 USDT
Total Bs.S
Bs.S 63.000
Banco
BNC
Venta
COMPLETED
04/08/26, 03:38 p. m.
Cantidad
81.99 USDT
Total Bs.S
Bs.S 70.000
Banco
BNC
Venta
COMPLETED
04/08/26, 03:29 p. m.
Cantidad
105.42 USDT
Total Bs.S
Bs.S 90.000
Banco
BNC
Venta
COMPLETED
04/08/26, 03:18 p. m.
Cantidad
65.59 USDT
Total Bs.S
Bs.S 56.000
Banco
BNC
Venta
COMPLETED
04/08/26, 03:10 p. m.
Cantidad
80.06 USDT
Total Bs.S
Bs.S 68.347
Banco
BNC
Venta
CANCELLED
04/08/26, 03:03 p. m.
Cantidad
105.52 USDT
Total Bs.S
Bs.S 90.000
Banco
PagoMovil
Venta
COMPLETED
04/08/26, 03:01 p. m.
Cantidad
59.97 USDT
Total Bs.S
Bs.S 51.151
Banco
BNC
Venta
COMPLETED
04/08/26, 03:00 p. m.
Cantidad
58.62 USDT
Total Bs.S
Bs.S 50.000
Banco
BNC
Venta
COMPLETED
04/08/26, 03:00 p. m.
Cantidad
58.62 USDT
Total Bs.S
Bs.S 50.000
Banco
BNC
Venta
COMPLETED
04/08/26, 02:49 p. m.
Cantidad
150.30 USDT
Total Bs.S
Bs.S 128.191
Banco
BNC
Venta
COMPLETED
04/08/26, 02:49 p. m.
Cantidad
95.19 USDT
Total Bs.S
Bs.S 81.188
Banco
BNC
Venta
COMPLETED
04/08/26, 02:43 p. m.
Cantidad
86.76 USDT
Total Bs.S
Bs.S 74.000
Banco
BNCBancoNacional
Venta
COMPLETED
04/08/26, 02:43 p. m.
Cantidad
59.79 USDT
Total Bs.S
Bs.S 51.000
Banco
BNC
Venta
COMPLETED
04/08/26, 02:36 p. m.
Cantidad
200.06 USDT
Total Bs.S
Bs.S 170.431
Banco
provincial
Venta
COMPLETED
04/08/26, 02:35 p. m.
Cantidad
58.69 USDT
Total Bs.S
Bs.S 50.000
Banco
BBVABank
Venta
COMPLETED
04/08/26, 02:34 p. m.
Cantidad
105.64 USDT
Total Bs.S
Bs.S 90.000
Banco
Provincial
Venta
COMPLETED
04/08/26, 02:34 p. m.
Cantidad
72.56 USDT
Total Bs.S
Bs.S 61.822
Banco
BNCBancoNacional
Venta
COMPLETED
04/08/26, 02:16 p. m.
Cantidad
234.32 USDT
Total Bs.S
Bs.S 200.000
Banco
provincial
Venta
COMPLETED
04/08/26, 02:10 p. m.
Cantidad
140.59 USDT
Total Bs.S
Bs.S 120.000
Banco
provincial
Venta
COMPLETED
04/08/26, 02:09 p. m.
Cantidad
400.80 USDT
Total Bs.S
Bs.S 342.083
Banco
provincial
Venta
CANCELLED_BY_SYSTEM
04/08/26, 02:03 p. m.
Cantidad
222.61 USDT
Total Bs.S
Bs.S 190.000
Banco
PagoMovil
Venta
COMPLETED
04/08/26, 01:58 p. m.
Cantidad
201.52 USDT
Total Bs.S
Bs.S 172.000
Banco
Mercantil
Venta
CANCELLED
04/08/26, 01:39 p. m.
Cantidad
351.41 USDT
Total Bs.S
Bs.S 300.000
Banco
PagoMovil
Venta
CANCELLED
04/08/26, 01:21 p. m.
Cantidad
92.45 USDT
Total Bs.S
Bs.S 78.950
Banco
PagoMovil
Venta
COMPLETED
04/08/26, 01:11 p. m.
Cantidad
100.29 USDT
Total Bs.S
Bs.S 85.641
Banco
Mercantil
Venta
COMPLETED
04/08/26, 01:05 p. m.
Cantidad
99.77 USDT
Total Bs.S
Bs.S 85.100
Banco
Mercantil
Venta
COMPLETED
04/08/26, 01:00 p. m.
Cantidad
60.06 USDT
Total Bs.S
Bs.S 51.225
Banco
Mercantil
Venta
COMPLETED
04/08/26, 01:00 p. m.
Cantidad
58.62 USDT
Total Bs.S
Bs.S 50.000
Banco
Mercantil
Venta
COMPLETED
04/08/26, 12:44 p. m.
Cantidad
200.40 USDT
Total Bs.S
Bs.S 170.921
Banco
Mercantil
Venta
CANCELLED
04/08/26, 12:43 p. m.
Cantidad
80.16 USDT
Total Bs.S
Bs.S 68.368
Banco
PagoMovil
'''

def parse_bs(s):
    parts = s.split('.')
    if len(parts) == 1: return float(parts[0])
    if len(parts[-1]) == 3: return float(''.join(parts))
    return float(''.join(parts[:-1]) + '.' + parts[-1])

pat = re.compile(
    r'(Compra|Venta)\s*\n'
    r'(COMPLETED|BUYER_PAYED|CANCELLED(?:_BY_SYSTEM)?)\s*\n'
    r'(\d{2}/\d{2}/\d{2}),[^\n]*\n'
    r'Cantidad\s*\n'
    r'([\d.]+)\s*USDT\s*\n'
    r'Total Bs\.S\s*\n'
    r'Bs\.S\s*([\d.]+)\s*\n'
    r'Banco\s*\n'
    r'([^\n]+)',
    re.MULTILINE,
)

rows = []
for m in pat.finditer(RAW):
    typ, status, date, usdt, total, banco = m.groups()
    rows.append({
        'type': typ, 'status': status, 'date': date,
        'usdt': float(usdt), 'total': parse_bs(total),
        'banco': banco.strip(),
    })

print('parseadas', len(rows))
from collections import Counter
print('status', dict(Counter(r['status'] for r in rows)))

ok = [r for r in rows if r['status']=='COMPLETED']
pending = [r for r in rows if r['status']=='BUYER_PAYED']

def is_pm(b):
    return 'pagomovil' in b.lower().replace(' ', '')

by_day = defaultdict(lambda: {'bu':0,'bbs':0,'bn':0,'su':0,'sbs':0,'sn':0})
bu=bbs=su=sbs=0.0
nb=ns=0
pm_buy_bs=pm_sell_bs=0.0
pm_bn=pm_sn=0

for r in ok:
    d = by_day[r['date']]
    if r['type']=='Compra':
        d['bu']+=r['usdt']; d['bbs']+=r['total']; d['bn']+=1
        bu+=r['usdt']; bbs+=r['total']; nb+=1
        if is_pm(r['banco']):
            pm_buy_bs += r['total']; pm_bn += 1
    else:
        d['su']+=r['usdt']; d['sbs']+=r['total']; d['sn']+=1
        su+=r['usdt']; sbs+=r['total']; ns+=1
        if is_pm(r['banco']):
            pm_sell_bs += r['total']; pm_sn += 1

def fmt(n): return f'{n:,.0f}'.replace(',', '.')

print('\n=== POR DIA ===')
for d in sorted(by_day.keys(), key=lambda x: (x[6:8], x[3:5], x[0:2])):
    x=by_day[d]
    print(f"{d}: C {x['bn']:3d} {x['bu']:10.2f} Bs {fmt(x['bbs']):>10} | V {x['sn']:3d} {x['su']:10.2f} Bs {fmt(x['sbs']):>10} | neto {x['bu']-x['su']:+.2f}")

print('\n=== TOTAL COMPLETED ===')
print(f'Compras {nb} | {bu:.2f} USDT | Bs {fmt(bbs)} | media {bbs/bu:.2f}')
print(f'Ventas  {ns} | {su:.2f} USDT | Bs {fmt(sbs)} | media {sbs/su:.2f}')
net = bu - su
print(f'Neto USDT {net:+.2f}')
if net < 0:
    print(f'FALTA COMPRAR {abs(net):.2f}')
else:
    print(f'SOBRANTE {net:.2f}')

matched = min(bu, su)
spread = (sbs/su) - (bbs/bu)
profit = matched * spread
print(f'\nSpread {spread:.2f}')
print(f'Ganancia bruta Bs {fmt(profit)} (~{profit/(bbs/bu):.2f} USDT) ROI {100*profit/(matched*(bbs/bu)):.2f}%')

# Fee 0.30% solo PagoMovil
fee_rate = 0.003
fee_buy = pm_buy_bs * fee_rate
fee_sell = pm_sell_bs * fee_rate
fee_both = fee_buy + fee_sell
print(f'\nPagoMovil compras: {pm_bn} ops Bs {fmt(pm_buy_bs)} fee {fmt(fee_buy)}')
print(f'PagoMovil ventas:  {pm_sn} ops Bs {fmt(pm_sell_bs)} fee {fmt(fee_sell)}')
print(f'Fee total PM (ambos): Bs {fmt(fee_both)} (~{fee_both/(bbs/bu):.2f} USDT)')

# Efectivo con fee PM en ambos
buy_eff = bbs + fee_buy
sell_eff = sbs - fee_sell
avg_b_e = buy_eff/bu
avg_s_e = sell_eff/su
spread_e = avg_s_e - avg_b_e
profit_e = matched * spread_e
print(f'Ganancia neta c/PM ambos: Bs {fmt(profit_e)} (~{profit_e/avg_b_e:.2f} USDT)')

# Solo fee en compras (tu pagas)
buy_eff2 = bbs + fee_buy
spread2 = (sbs/su) - (buy_eff2/bu)
profit2 = matched * spread2
print(f'Ganancia neta c/PM solo compras: Bs {fmt(profit2)} (~{profit2/(buy_eff2/bu):.2f} USDT)')

pend_u = sum(r['usdt'] for r in pending)
print(f'\nBUYER_PAYED: {pend_u:.2f} USDT')
if net < 0:
    print(f'Si completa pending, falta: {abs(net)-pend_u:.2f}')
else:
    print(f'Si completa pending, sobrante: {net+pend_u:.2f}')
