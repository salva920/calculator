# -*- coding: utf-8 -*-
"""Parse multi-line Binance-style dump and summarize COMPLETED buy/sell."""
import re
from collections import defaultdict

RAW = r'''
Compra
COMPLETED
03/08/26, 02:19 p. m.
Cantidad
5.95 USDT
Total Bs.S
Bs.S 5.000
P. unitario
Bs.S 839
Compra
COMPLETED
03/08/26, 02:19 p. m.
Cantidad
5.95 USDT
Total Bs.S
Bs.S 5.000
P. unitario
Bs.S 839
Compra
COMPLETED
03/08/26, 02:19 p. m.
Cantidad
5.95 USDT
Total Bs.S
Bs.S 5.000
P. unitario
Bs.S 839
Compra
BUYER_PAYED
03/08/26, 02:19 p. m.
Cantidad
9.94 USDT
Total Bs.S
Bs.S 8.340
P. unitario
Bs.S 839
Compra
COMPLETED
03/08/26, 02:19 p. m.
Cantidad
10.13 USDT
Total Bs.S
Bs.S 8.500
P. unitario
Bs.S 839
Compra
COMPLETED
03/08/26, 02:19 p. m.
Cantidad
6.99 USDT
Total Bs.S
Bs.S 5.865
P. unitario
Bs.S 839
Compra
CANCELLED
03/08/26, 02:18 p. m.
Cantidad
9.94 USDT
Total Bs.S
Bs.S 8.340
P. unitario
Bs.S 839
Venta
COMPLETED
03/08/26, 02:11 p. m.
Cantidad
70.74 USDT
Total Bs.S
Bs.S 60.000
P. unitario
Bs.S 848
Compra
COMPLETED
03/08/26, 02:03 p. m.
Cantidad
25.95 USDT
Total Bs.S
Bs.S 21.850
P. unitario
Bs.S 842
Compra
COMPLETED
03/08/26, 02:03 p. m.
Cantidad
19.96 USDT
Total Bs.S
Bs.S 16.806
P. unitario
Bs.S 842
Compra
COMPLETED
03/08/26, 02:03 p. m.
Cantidad
11.87 USDT
Total Bs.S
Bs.S 10.000
P. unitario
Bs.S 842
Compra
BUYER_PAYED
03/08/26, 02:03 p. m.
Cantidad
25.94 USDT
Total Bs.S
Bs.S 21.842
P. unitario
Bs.S 842
Compra
COMPLETED
03/08/26, 02:03 p. m.
Cantidad
29.94 USDT
Total Bs.S
Bs.S 25.210
P. unitario
Bs.S 842
Compra
COMPLETED
03/08/26, 02:03 p. m.
Cantidad
14.25 USDT
Total Bs.S
Bs.S 12.000
P. unitario
Bs.S 842
Compra
COMPLETED
03/08/26, 02:03 p. m.
Cantidad
20.20 USDT
Total Bs.S
Bs.S 17.008
P. unitario
Bs.S 842
Compra
COMPLETED
03/08/26, 02:03 p. m.
Cantidad
15.43 USDT
Total Bs.S
Bs.S 13.000
P. unitario
Bs.S 842
Compra
COMPLETED
03/08/26, 01:48 p. m.
Cantidad
41.56 USDT
Total Bs.S
Bs.S 35.000
P. unitario
Bs.S 842
Compra
COMPLETED
03/08/26, 01:48 p. m.
Cantidad
35.62 USDT
Total Bs.S
Bs.S 30.000
P. unitario
Bs.S 842
Compra
COMPLETED
03/08/26, 01:47 p. m.
Cantidad
39.94 USDT
Total Bs.S
Bs.S 33.630
P. unitario
Bs.S 842
Compra
COMPLETED
03/08/26, 01:46 p. m.
Cantidad
49.90 USDT
Total Bs.S
Bs.S 42.016
P. unitario
Bs.S 842
Compra
COMPLETED
03/08/26, 01:46 p. m.
Cantidad
49.90 USDT
Total Bs.S
Bs.S 42.016
P. unitario
Bs.S 842
Compra
COMPLETED
03/08/26, 01:44 p. m.
Cantidad
46.94 USDT
Total Bs.S
Bs.S 39.524
P. unitario
Bs.S 842
Compra
COMPLETED
03/08/26, 01:44 p. m.
Cantidad
39.84 USDT
Total Bs.S
Bs.S 33.550
P. unitario
Bs.S 842
Compra
COMPLETED
03/08/26, 01:43 p. m.
Cantidad
38.00 USDT
Total Bs.S
Bs.S 32.000
P. unitario
Bs.S 842
Compra
COMPLETED
03/08/26, 01:43 p. m.
Cantidad
99.94 USDT
Total Bs.S
Bs.S 84.150
P. unitario
Bs.S 842
Compra
COMPLETED
03/08/26, 01:38 p. m.
Cantidad
199.94 USDT
Total Bs.S
Bs.S 168.611
P. unitario
Bs.S 843
Compra
COMPLETED
03/08/26, 01:36 p. m.
Cantidad
99.94 USDT
Total Bs.S
Bs.S 84.280
P. unitario
Bs.S 843
Compra
COMPLETED
03/08/26, 01:35 p. m.
Cantidad
74.85 USDT
Total Bs.S
Bs.S 63.122
P. unitario
Bs.S 843
Compra
COMPLETED
03/08/26, 01:34 p. m.
Cantidad
83.00 USDT
Total Bs.S
Bs.S 70.000
P. unitario
Bs.S 843
Compra
COMPLETED
03/08/26, 01:34 p. m.
Cantidad
79.94 USDT
Total Bs.S
Bs.S 67.414
P. unitario
Bs.S 843
Compra
COMPLETED
03/08/26, 01:33 p. m.
Cantidad
84.94 USDT
Total Bs.S
Bs.S 71.631
P. unitario
Bs.S 843
Compra
COMPLETED
03/08/26, 01:27 p. m.
Cantidad
59.94 USDT
Total Bs.S
Bs.S 50.536
P. unitario
Bs.S 843
Compra
COMPLETED
03/08/26, 01:26 p. m.
Cantidad
86.94 USDT
Total Bs.S
Bs.S 73.300
P. unitario
Bs.S 843
Compra
COMPLETED
03/08/26, 01:26 p. m.
Cantidad
59.94 USDT
Total Bs.S
Bs.S 50.536
P. unitario
Bs.S 843
Compra
COMPLETED
03/08/26, 01:26 p. m.
Cantidad
69.86 USDT
Total Bs.S
Bs.S 58.900
P. unitario
Bs.S 843
Compra
COMPLETED
03/08/26, 01:26 p. m.
Cantidad
83.02 USDT
Total Bs.S
Bs.S 70.000
P. unitario
Bs.S 843
Compra
COMPLETED
03/08/26, 01:26 p. m.
Cantidad
74.72 USDT
Total Bs.S
Bs.S 63.000
P. unitario
Bs.S 843
Compra
COMPLETED
03/08/26, 01:25 p. m.
Cantidad
79.94 USDT
Total Bs.S
Bs.S 67.398
P. unitario
Bs.S 843
Compra
COMPLETED
03/08/26, 01:23 p. m.
Cantidad
99.80 USDT
Total Bs.S
Bs.S 84.086
P. unitario
Bs.S 843
Compra
COMPLETED
03/08/26, 01:21 p. m.
Cantidad
132.27 USDT
Total Bs.S
Bs.S 111.452
P. unitario
Bs.S 843
Compra
COMPLETED
03/08/26, 10:31 a. m.
Cantidad
99.50 USDT
Total Bs.S
Bs.S 83.481
P. unitario
Bs.S 839
Compra
COMPLETED
03/08/26, 10:31 a. m.
Cantidad
59.59 USDT
Total Bs.S
Bs.S 50.000
P. unitario
Bs.S 839
Compra
COMPLETED
03/08/26, 10:30 a. m.
Cantidad
99.80 USDT
Total Bs.S
Bs.S 83.732
P. unitario
Bs.S 839
Compra
COMPLETED
03/08/26, 10:30 a. m.
Cantidad
71.51 USDT
Total Bs.S
Bs.S 60.000
P. unitario
Bs.S 839
Compra
COMPLETED
03/08/26, 10:30 a. m.
Cantidad
89.94 USDT
Total Bs.S
Bs.S 75.460
P. unitario
Bs.S 839
Compra
COMPLETED
03/08/26, 10:29 a. m.
Cantidad
59.59 USDT
Total Bs.S
Bs.S 50.000
P. unitario
Bs.S 839
Compra
COMPLETED
03/08/26, 10:28 a. m.
Cantidad
59.94 USDT
Total Bs.S
Bs.S 50.290
P. unitario
Bs.S 839
Compra
COMPLETED
03/08/26, 10:28 a. m.
Cantidad
166.12 USDT
Total Bs.S
Bs.S 139.376
P. unitario
Bs.S 839
Compra
COMPLETED
03/08/26, 10:28 a. m.
Cantidad
77.94 USDT
Total Bs.S
Bs.S 65.392
P. unitario
Bs.S 839
Compra
COMPLETED
03/08/26, 10:28 a. m.
Cantidad
61.97 USDT
Total Bs.S
Bs.S 52.000
P. unitario
Bs.S 839
Compra
COMPLETED
03/08/26, 10:24 a. m.
Cantidad
79.92 USDT
Total Bs.S
Bs.S 67.000
P. unitario
Bs.S 838
Compra
COMPLETED
03/08/26, 10:18 a. m.
Cantidad
64.41 USDT
Total Bs.S
Bs.S 54.000
P. unitario
Bs.S 838
Compra
COMPLETED
03/08/26, 10:17 a. m.
Cantidad
60.34 USDT
Total Bs.S
Bs.S 50.584
P. unitario
Bs.S 838
Compra
COMPLETED
03/08/26, 10:16 a. m.
Cantidad
89.82 USDT
Total Bs.S
Bs.S 75.297
P. unitario
Bs.S 838
Compra
COMPLETED
03/08/26, 10:13 a. m.
Cantidad
59.76 USDT
Total Bs.S
Bs.S 50.000
P. unitario
Bs.S 837
Compra
COMPLETED
03/08/26, 10:12 a. m.
Cantidad
60.36 USDT
Total Bs.S
Bs.S 50.498
P. unitario
Bs.S 837
Compra
COMPLETED
03/08/26, 10:08 a. m.
Cantidad
59.76 USDT
Total Bs.S
Bs.S 50.000
P. unitario
Bs.S 837
Compra
COMPLETED
03/08/26, 10:06 a. m.
Cantidad
99.94 USDT
Total Bs.S
Bs.S 83.605
P. unitario
Bs.S 837
Compra
COMPLETED
03/08/26, 10:00 a. m.
Cantidad
99.80 USDT
Total Bs.S
Bs.S 83.454
P. unitario
Bs.S 836
Compra
COMPLETED
03/08/26, 09:59 a. m.
Cantidad
99.80 USDT
Total Bs.S
Bs.S 83.454
P. unitario
Bs.S 836
Compra
COMPLETED
03/08/26, 09:57 a. m.
Cantidad
69.94 USDT
Total Bs.S
Bs.S 58.485
P. unitario
Bs.S 836
Compra
COMPLETED
03/08/26, 09:57 a. m.
Cantidad
70.55 USDT
Total Bs.S
Bs.S 59.000
P. unitario
Bs.S 836
Compra
COMPLETED
03/08/26, 09:56 a. m.
Cantidad
149.94 USDT
Total Bs.S
Bs.S 125.381
P. unitario
Bs.S 836
Compra
COMPLETED
03/08/26, 09:56 a. m.
Cantidad
60.43 USDT
Total Bs.S
Bs.S 50.532
P. unitario
Bs.S 836
Compra
COMPLETED
03/08/26, 09:51 a. m.
Cantidad
89.71 USDT
Total Bs.S
Bs.S 75.000
P. unitario
Bs.S 836
Compra
COMPLETED
03/08/26, 09:44 a. m.
Cantidad
69.94 USDT
Total Bs.S
Bs.S 58.470
P. unitario
Bs.S 836
Compra
COMPLETED
03/08/26, 09:29 a. m.
Cantidad
61.94 USDT
Total Bs.S
Bs.S 52.000
P. unitario
Bs.S 840
Compra
COMPLETED
03/08/26, 09:29 a. m.
Cantidad
71.47 USDT
Total Bs.S
Bs.S 60.000
P. unitario
Bs.S 840
Compra
COMPLETED
03/08/26, 09:29 a. m.
Cantidad
449.07 USDT
Total Bs.S
Bs.S 377.000
P. unitario
Bs.S 840
Compra
COMPLETED
03/08/26, 09:28 a. m.
Cantidad
59.55 USDT
Total Bs.S
Bs.S 50.000
P. unitario
Bs.S 840
Compra
COMPLETED
03/08/26, 09:28 a. m.
Cantidad
79.84 USDT
Total Bs.S
Bs.S 67.026
P. unitario
Bs.S 840
Compra
COMPLETED
03/08/26, 09:27 a. m.
Cantidad
59.55 USDT
Total Bs.S
Bs.S 50.000
P. unitario
Bs.S 840
Compra
COMPLETED
03/08/26, 09:27 a. m.
Cantidad
59.55 USDT
Total Bs.S
Bs.S 50.000
P. unitario
Bs.S 840
Compra
COMPLETED
03/08/26, 09:26 a. m.
Cantidad
79.84 USDT
Total Bs.S
Bs.S 67.026
P. unitario
Bs.S 840
Compra
COMPLETED
03/08/26, 09:26 a. m.
Cantidad
79.84 USDT
Total Bs.S
Bs.S 67.026
P. unitario
Bs.S 840
Compra
COMPLETED
03/08/26, 09:08 a. m.
Cantidad
69.94 USDT
Total Bs.S
Bs.S 58.540
P. unitario
Bs.S 837
Compra
COMPLETED
03/08/26, 08:45 a. m.
Cantidad
199.60 USDT
Total Bs.S
Bs.S 167.207
P. unitario
Bs.S 838
Compra
COMPLETED
03/08/26, 08:44 a. m.
Cantidad
249.50 USDT
Total Bs.S
Bs.S 209.009
P. unitario
Bs.S 838
Compra
COMPLETED
03/08/26, 08:44 a. m.
Cantidad
87.83 USDT
Total Bs.S
Bs.S 73.576
P. unitario
Bs.S 838
Compra
COMPLETED
03/08/26, 08:43 a. m.
Cantidad
129.74 USDT
Total Bs.S
Bs.S 108.684
P. unitario
Bs.S 838
Compra
COMPLETED
03/08/26, 08:40 a. m.
Cantidad
68.94 USDT
Total Bs.S
Bs.S 57.752
P. unitario
Bs.S 838
Compra
COMPLETED
03/08/26, 08:13 a. m.
Cantidad
59.79 USDT
Total Bs.S
Bs.S 50.000
P. unitario
Bs.S 836
Compra
COMPLETED
02/08/26, 09:10 p. m.
Cantidad
499.00 USDT
Total Bs.S
Bs.S 417.666
P. unitario
Bs.S 837
Compra
COMPLETED
02/08/26, 08:20 p. m.
Cantidad
698.60 USDT
Total Bs.S
Bs.S 584.733
P. unitario
Bs.S 837
Compra
COMPLETED
02/08/26, 07:59 p. m.
Cantidad
89.82 USDT
Total Bs.S
Bs.S 75.212
P. unitario
Bs.S 837
Venta
COMPLETED
02/08/26, 12:00 p. m.
Cantidad
70.06 USDT
Total Bs.S
Bs.S 59.964
P. unitario
Bs.S 856
Venta
COMPLETED
02/08/26, 11:25 a. m.
Cantidad
58.55 USDT
Total Bs.S
Bs.S 50.000
P. unitario
Bs.S 854
Venta
COMPLETED
02/08/26, 11:22 a. m.
Cantidad
75.15 USDT
Total Bs.S
Bs.S 64.171
P. unitario
Bs.S 854
Venta
COMPLETED
02/08/26, 11:21 a. m.
Cantidad
331.58 USDT
Total Bs.S
Bs.S 283.140
P. unitario
Bs.S 854
Venta
CANCELLED_BY_SYSTEM
02/08/26, 11:20 a. m.
Cantidad
99.54 USDT
Total Bs.S
Bs.S 85.000
P. unitario
Bs.S 854
Venta
COMPLETED
02/08/26, 11:16 a. m.
Cantidad
77.94 USDT
Total Bs.S
Bs.S 66.560
P. unitario
Bs.S 854
Venta
COMPLETED
02/08/26, 11:13 a. m.
Cantidad
110.04 USDT
Total Bs.S
Bs.S 93.965
P. unitario
Bs.S 854
Venta
COMPLETED
02/08/26, 11:12 a. m.
Cantidad
61.77 USDT
Total Bs.S
Bs.S 52.750
P. unitario
Bs.S 854
Venta
COMPLETED
02/08/26, 11:12 a. m.
Cantidad
150.06 USDT
Total Bs.S
Bs.S 128.136
P. unitario
Bs.S 854
Compra
COMPLETED
01/08/26, 07:34 p. m.
Cantidad
92.94 USDT
Total Bs.S
Bs.S 77.838
P. unitario
Bs.S 838
Compra
COMPLETED
01/08/26, 07:29 p. m.
Cantidad
119.33 USDT
Total Bs.S
Bs.S 100.000
P. unitario
Bs.S 838
Compra
COMPLETED
01/08/26, 07:27 p. m.
Cantidad
76.37 USDT
Total Bs.S
Bs.S 64.000
P. unitario
Bs.S 838
Compra
COMPLETED
01/08/26, 07:11 p. m.
Cantidad
269.94 USDT
Total Bs.S
Bs.S 226.280
P. unitario
Bs.S 838
Compra
COMPLETED
01/08/26, 07:08 p. m.
Cantidad
69.94 USDT
Total Bs.S
Bs.S 58.628
P. unitario
Bs.S 838
Compra
COMPLETED
01/08/26, 01:23 p. m.
Cantidad
80.09 USDT
Total Bs.S
Bs.S 67.200
P. unitario
Bs.S 839
Compra
COMPLETED
01/08/26, 01:22 p. m.
Cantidad
70.32 USDT
Total Bs.S
Bs.S 59.000
P. unitario
Bs.S 839
Compra
COMPLETED
01/08/26, 01:21 p. m.
Cantidad
60.19 USDT
Total Bs.S
Bs.S 50.499
P. unitario
Bs.S 839
Compra
COMPLETED
01/08/26, 01:20 p. m.
Cantidad
99.80 USDT
Total Bs.S
Bs.S 83.732
P. unitario
Bs.S 839
Compra
COMPLETED
01/08/26, 01:19 p. m.
Cantidad
60.19 USDT
Total Bs.S
Bs.S 50.499
P. unitario
Bs.S 839
Compra
COMPLETED
01/08/26, 01:03 p. m.
Cantidad
64.94 USDT
Total Bs.S
Bs.S 54.550
P. unitario
Bs.S 840
Compra
COMPLETED
01/08/26, 01:03 p. m.
Cantidad
71.42 USDT
Total Bs.S
Bs.S 60.000
P. unitario
Bs.S 840
Compra
COMPLETED
01/08/26, 01:03 p. m.
Cantidad
99.80 USDT
Total Bs.S
Bs.S 83.832
P. unitario
Bs.S 840
Compra
COMPLETED
01/08/26, 01:03 p. m.
Cantidad
89.94 USDT
Total Bs.S
Bs.S 75.550
P. unitario
Bs.S 840
Compra
COMPLETED
01/08/26, 01:03 p. m.
Cantidad
99.50 USDT
Total Bs.S
Bs.S 83.580
P. unitario
Bs.S 840
Compra
COMPLETED
01/08/26, 01:03 p. m.
Cantidad
83.33 USDT
Total Bs.S
Bs.S 70.000
P. unitario
Bs.S 840
Compra
COMPLETED
01/08/26, 01:03 p. m.
Cantidad
94.94 USDT
Total Bs.S
Bs.S 79.750
P. unitario
Bs.S 840
Compra
COMPLETED
01/08/26, 01:02 p. m.
Cantidad
59.52 USDT
Total Bs.S
Bs.S 50.000
P. unitario
Bs.S 840
Compra
COMPLETED
01/08/26, 01:02 p. m.
Cantidad
59.52 USDT
Total Bs.S
Bs.S 50.000
P. unitario
Bs.S 840
Compra
COMPLETED
01/08/26, 01:02 p. m.
Cantidad
195.23 USDT
Total Bs.S
Bs.S 164.000
P. unitario
Bs.S 840
Compra
COMPLETED
01/08/26, 01:02 p. m.
Cantidad
70.83 USDT
Total Bs.S
Bs.S 59.500
P. unitario
Bs.S 840
Compra
COMPLETED
01/08/26, 01:02 p. m.
Cantidad
63.09 USDT
Total Bs.S
Bs.S 53.000
P. unitario
Bs.S 840
Compra
COMPLETED
01/08/26, 12:50 p. m.
Cantidad
153.74 USDT
Total Bs.S
Bs.S 129.142
P. unitario
Bs.S 840
Compra
COMPLETED
01/08/26, 12:49 p. m.
Cantidad
60.12 USDT
Total Bs.S
Bs.S 50.501
P. unitario
Bs.S 840
Compra
COMPLETED
01/08/26, 12:49 p. m.
Cantidad
68.35 USDT
Total Bs.S
Bs.S 57.414
P. unitario
Bs.S 840
Compra
COMPLETED
01/08/26, 12:49 p. m.
Cantidad
99.94 USDT
Total Bs.S
Bs.S 83.950
P. unitario
Bs.S 840
Compra
COMPLETED
01/08/26, 12:49 p. m.
Cantidad
71.42 USDT
Total Bs.S
Bs.S 60.000
P. unitario
Bs.S 840
Compra
COMPLETED
01/08/26, 12:49 p. m.
Cantidad
62.94 USDT
Total Bs.S
Bs.S 52.870
P. unitario
Bs.S 840
Compra
COMPLETED
01/08/26, 12:49 p. m.
Cantidad
88.88 USDT
Total Bs.S
Bs.S 74.662
P. unitario
Bs.S 840
Compra
COMPLETED
01/08/26, 12:49 p. m.
Cantidad
62.87 USDT
Total Bs.S
Bs.S 52.811
P. unitario
Bs.S 840
Compra
COMPLETED
01/08/26, 12:49 p. m.
Cantidad
74.85 USDT
Total Bs.S
Bs.S 62.874
P. unitario
Bs.S 840
Compra
COMPLETED
01/08/26, 12:39 p. m.
Cantidad
68.66 USDT
Total Bs.S
Bs.S 57.606
P. unitario
Bs.S 839
Compra
COMPLETED
01/08/26, 12:33 p. m.
Cantidad
60.22 USDT
Total Bs.S
Bs.S 50.502
P. unitario
Bs.S 839
Compra
COMPLETED
01/08/26, 12:33 p. m.
Cantidad
66.44 USDT
Total Bs.S
Bs.S 55.719
P. unitario
Bs.S 839
Compra
COMPLETED
01/08/26, 12:33 p. m.
Cantidad
64.94 USDT
Total Bs.S
Bs.S 54.461
P. unitario
Bs.S 839
Compra
COMPLETED
01/08/26, 12:33 p. m.
Cantidad
69.86 USDT
Total Bs.S
Bs.S 58.587
P. unitario
Bs.S 839
Compra
COMPLETED
01/08/26, 12:32 p. m.
Cantidad
59.62 USDT
Total Bs.S
Bs.S 50.000
P. unitario
Bs.S 839
Compra
COMPLETED
01/08/26, 12:32 p. m.
Cantidad
59.62 USDT
Total Bs.S
Bs.S 50.000
P. unitario
Bs.S 839
Compra
COMPLETED
01/08/26, 12:32 p. m.
Cantidad
60.22 USDT
Total Bs.S
Bs.S 50.502
P. unitario
Bs.S 839
Compra
COMPLETED
01/08/26, 12:21 p. m.
Cantidad
59.72 USDT
Total Bs.S
Bs.S 50.000
P. unitario
Bs.S 837
Compra
COMPLETED
01/08/26, 12:19 p. m.
Cantidad
99.94 USDT
Total Bs.S
Bs.S 83.661
P. unitario
Bs.S 837
Compra
COMPLETED
01/08/26, 12:17 p. m.
Cantidad
129.74 USDT
Total Bs.S
Bs.S 108.607
P. unitario
Bs.S 837
Compra
COMPLETED
01/08/26, 09:34 a. m.
Cantidad
59.37 USDT
Total Bs.S
Bs.S 50.000
P. unitario
Bs.S 842
Compra
COMPLETED
01/08/26, 09:34 a. m.
Cantidad
59.37 USDT
Total Bs.S
Bs.S 50.000
P. unitario
Bs.S 842
Compra
COMPLETED
01/08/26, 09:34 a. m.
Cantidad
99.94 USDT
Total Bs.S
Bs.S 84.160
P. unitario
Bs.S 842
Compra
COMPLETED
01/08/26, 09:32 a. m.
Cantidad
68.94 USDT
Total Bs.S
Bs.S 58.055
P. unitario
Bs.S 842
Compra
COMPLETED
01/08/26, 09:32 a. m.
Cantidad
59.37 USDT
Total Bs.S
Bs.S 50.000
P. unitario
Bs.S 842
Compra
COMPLETED
01/08/26, 09:32 a. m.
Cantidad
64.94 USDT
Total Bs.S
Bs.S 54.687
P. unitario
Bs.S 842
Compra
COMPLETED
01/08/26, 09:31 a. m.
Cantidad
60.94 USDT
Total Bs.S
Bs.S 51.318
P. unitario
Bs.S 842
Compra
CANCELLED
01/08/26, 09:31 a. m.
Cantidad
89.06 USDT
Total Bs.S
Bs.S 75.000
P. unitario
Bs.S 842
Compra
CANCELLED
01/08/26, 09:31 a. m.
Cantidad
79.79 USDT
Total Bs.S
Bs.S 67.196
P. unitario
Bs.S 842
Compra
CANCELLED
01/08/26, 09:31 a. m.
Cantidad
99.94 USDT
Total Bs.S
Bs.S 84.160
P. unitario
Bs.S 842
Compra
CANCELLED
01/08/26, 09:30 a. m.
Cantidad
69.86 USDT
Total Bs.S
Bs.S 58.830
P. unitario
Bs.S 842
Compra
CANCELLED
01/08/26, 09:30 a. m.
Cantidad
73.94 USDT
Total Bs.S
Bs.S 62.266
P. unitario
Bs.S 842
Compra
COMPLETED
01/08/26, 09:30 a. m.
Cantidad
59.37 USDT
Total Bs.S
Bs.S 50.000
P. unitario
Bs.S 842
Compra
CANCELLED
01/08/26, 09:30 a. m.
Cantidad
80.74 USDT
Total Bs.S
Bs.S 68.000
P. unitario
Bs.S 842
Compra
CANCELLED
01/08/26, 09:29 a. m.
Cantidad
62.10 USDT
Total Bs.S
Bs.S 52.300
P. unitario
Bs.S 842
Compra
CANCELLED
01/08/26, 09:29 a. m.
Cantidad
99.94 USDT
Total Bs.S
Bs.S 84.160
P. unitario
Bs.S 842
Compra
CANCELLED_BY_SYSTEM
01/08/26, 09:27 a. m.
Cantidad
60.19 USDT
Total Bs.S
Bs.S 50.687
P. unitario
Bs.S 842
Compra
CANCELLED_BY_SYSTEM
01/08/26, 09:27 a. m.
Cantidad
83.12 USDT
Total Bs.S
Bs.S 70.000
P. unitario
Bs.S 842
Compra
COMPLETED
01/08/26, 08:45 a. m.
Cantidad
79.84 USDT
Total Bs.S
Bs.S 67.237
P. unitario
Bs.S 842
Compra
COMPLETED
31/07/26, 10:55 p. m.
Cantidad
12.03 USDT
Total Bs.S
Bs.S 10.080
P. unitario
Bs.S 837
Compra
COMPLETED
31/07/26, 10:36 p. m.
Cantidad
12.05 USDT
Total Bs.S
Bs.S 10.098
P. unitario
Bs.S 838
Compra
COMPLETED
31/07/26, 10:36 p. m.
Cantidad
11.93 USDT
Total Bs.S
Bs.S 10.000
P. unitario
Bs.S 838
Compra
COMPLETED
31/07/26, 10:36 p. m.
Cantidad
17.89 USDT
Total Bs.S
Bs.S 15.000
P. unitario
Bs.S 838
Compra
COMPLETED
31/07/26, 10:36 p. m.
Cantidad
19.96 USDT
Total Bs.S
Bs.S 16.727
P. unitario
Bs.S 838
Compra
COMPLETED
31/07/26, 10:36 p. m.
Cantidad
14.31 USDT
Total Bs.S
Bs.S 12.000
P. unitario
Bs.S 838
Compra
COMPLETED
31/07/26, 10:36 p. m.
Cantidad
19.94 USDT
Total Bs.S
Bs.S 16.710
P. unitario
Bs.S 838
Compra
COMPLETED
31/07/26, 10:35 p. m.
Cantidad
18.71 USDT
Total Bs.S
Bs.S 15.679
P. unitario
Bs.S 838
Compra
COMPLETED
31/07/26, 10:35 p. m.
Cantidad
11.93 USDT
Total Bs.S
Bs.S 10.000
P. unitario
Bs.S 838
Compra
COMPLETED
31/07/26, 10:35 p. m.
Cantidad
11.93 USDT
Total Bs.S
Bs.S 10.000
P. unitario
Bs.S 838
Compra
COMPLETED
31/07/26, 10:35 p. m.
Cantidad
14.95 USDT
Total Bs.S
Bs.S 12.530
P. unitario
Bs.S 838
Compra
COMPLETED
31/07/26, 10:35 p. m.
Cantidad
11.93 USDT
Total Bs.S
Bs.S 10.000
P. unitario
Bs.S 838
Compra
COMPLETED
31/07/26, 10:35 p. m.
Cantidad
17.89 USDT
Total Bs.S
Bs.S 15.000
P. unitario
Bs.S 838
Compra
COMPLETED
31/07/26, 10:13 p. m.
Cantidad
49.92 USDT
Total Bs.S
Bs.S 42.000
P. unitario
Bs.S 841
Compra
COMPLETED
31/07/26, 10:13 p. m.
Cantidad
14.26 USDT
Total Bs.S
Bs.S 12.000
P. unitario
Bs.S 841
Compra
COMPLETED
31/07/26, 10:13 p. m.
Cantidad
14.97 USDT
Total Bs.S
Bs.S 12.593
P. unitario
Bs.S 841
Compra
COMPLETED
31/07/26, 10:12 p. m.
Cantidad
19.02 USDT
Total Bs.S
Bs.S 16.000
P. unitario
Bs.S 841
Compra
COMPLETED
31/07/26, 10:12 p. m.
Cantidad
40.12 USDT
Total Bs.S
Bs.S 33.750
P. unitario
Bs.S 841
Compra
COMPLETED
31/07/26, 10:12 p. m.
Cantidad
14.97 USDT
Total Bs.S
Bs.S 12.593
P. unitario
Bs.S 841
Compra
COMPLETED
31/07/26, 10:12 p. m.
Cantidad
19.96 USDT
Total Bs.S
Bs.S 16.790
P. unitario
Bs.S 841
Compra
COMPLETED
31/07/26, 10:12 p. m.
Cantidad
24.94 USDT
Total Bs.S
Bs.S 20.980
P. unitario
Bs.S 841
Compra
CANCELLED
31/07/26, 10:12 p. m.
Cantidad
19.96 USDT
Total Bs.S
Bs.S 16.790
P. unitario
Bs.S 841
Compra
COMPLETED
31/07/26, 10:12 p. m.
Cantidad
17.59 USDT
Total Bs.S
Bs.S 14.800
P. unitario
Bs.S 841
Compra
COMPLETED
31/07/26, 10:12 p. m.
Cantidad
13.94 USDT
Total Bs.S
Bs.S 11.726
P. unitario
Bs.S 841
Compra
COMPLETED
31/07/26, 10:12 p. m.
Cantidad
29.94 USDT
Total Bs.S
Bs.S 25.186
P. unitario
Bs.S 841
Compra
COMPLETED
31/07/26, 10:12 p. m.
Cantidad
23.77 USDT
Total Bs.S
Bs.S 20.000
P. unitario
Bs.S 841
Compra
COMPLETED
31/07/26, 09:50 p. m.
Cantidad
19.94 USDT
Total Bs.S
Bs.S 16.794
P. unitario
Bs.S 842
Compra
COMPLETED
31/07/26, 09:49 p. m.
Cantidad
12.46 USDT
Total Bs.S
Bs.S 10.500
P. unitario
Bs.S 842
Compra
CANCELLED
31/07/26, 09:49 p. m.
Cantidad
35.62 USDT
Total Bs.S
Bs.S 30.000
P. unitario
Bs.S 842
Compra
COMPLETED
31/07/26, 09:49 p. m.
Cantidad
11.87 USDT
Total Bs.S
Bs.S 10.000
P. unitario
Bs.S 842
Compra
COMPLETED
31/07/26, 09:49 p. m.
Cantidad
27.30 USDT
Total Bs.S
Bs.S 23.000
P. unitario
Bs.S 842
Compra
COMPLETED
31/07/26, 09:49 p. m.
Cantidad
50.01 USDT
Total Bs.S
Bs.S 42.127
P. unitario
Bs.S 842
Compra
COMPLETED
31/07/26, 09:49 p. m.
Cantidad
19.96 USDT
Total Bs.S
Bs.S 16.811
P. unitario
Bs.S 842
Compra
COMPLETED
31/07/26, 09:49 p. m.
Cantidad
16.94 USDT
Total Bs.S
Bs.S 14.267
P. unitario
Bs.S 842
Compra
COMPLETED
31/07/26, 09:49 p. m.
Cantidad
39.94 USDT
Total Bs.S
Bs.S 33.638
P. unitario
Bs.S 842
Compra
COMPLETED
31/07/26, 09:49 p. m.
Cantidad
21.96 USDT
Total Bs.S
Bs.S 18.495
P. unitario
Bs.S 842
Compra
COMPLETED
31/07/26, 09:49 p. m.
Cantidad
27.30 USDT
Total Bs.S
Bs.S 23.000
P. unitario
Bs.S 842
Compra
COMPLETED
31/07/26, 09:49 p. m.
Cantidad
36.94 USDT
Total Bs.S
Bs.S 31.111
P. unitario
Bs.S 842
Compra
COMPLETED
31/07/26, 09:49 p. m.
Cantidad
26.71 USDT
Total Bs.S
Bs.S 22.500
P. unitario
Bs.S 842
Compra
COMPLETED
31/07/26, 09:49 p. m.
Cantidad
14.24 USDT
Total Bs.S
Bs.S 12.000
P. unitario
Bs.S 842
Compra
COMPLETED
31/07/26, 09:49 p. m.
Cantidad
27.30 USDT
Total Bs.S
Bs.S 23.000
P. unitario
Bs.S 842
Compra
COMPLETED
31/07/26, 09:49 p. m.
Cantidad
34.93 USDT
Total Bs.S
Bs.S 29.418
P. unitario
Bs.S 842
Compra
COMPLETED
31/07/26, 09:49 p. m.
Cantidad
14.94 USDT
Total Bs.S
Bs.S 12.583
P. unitario
Bs.S 842
Compra
COMPLETED
31/07/26, 09:49 p. m.
Cantidad
16.62 USDT
Total Bs.S
Bs.S 14.000
P. unitario
Bs.S 842
Compra
COMPLETED
31/07/26, 09:49 p. m.
Cantidad
29.94 USDT
Total Bs.S
Bs.S 25.216
P. unitario
Bs.S 842
Compra
COMPLETED
31/07/26, 09:49 p. m.
Cantidad
23.74 USDT
Total Bs.S
Bs.S 20.000
P. unitario
Bs.S 842
'''

# Append July 31 COMPLETED sales from previous message (same set)
SALES_31 = '''
Venta
COMPLETED
31/07/26, 08:52 p. m.
Cantidad
106.61 USDT
Total Bs.S
Bs.S 92.000
P. unitario
Bs.S 863
Venta
COMPLETED
31/07/26, 08:51 p. m.
Cantidad
100.82 USDT
Total Bs.S
Bs.S 87.000
P. unitario
Bs.S 863
Venta
COMPLETED
31/07/26, 08:49 p. m.
Cantidad
78.80 USDT
Total Bs.S
Bs.S 68.000
P. unitario
Bs.S 863
Venta
COMPLETED
31/07/26, 08:49 p. m.
Cantidad
57.94 USDT
Total Bs.S
Bs.S 50.000
P. unitario
Bs.S 863
Venta
COMPLETED
31/07/26, 08:47 p. m.
Cantidad
72.43 USDT
Total Bs.S
Bs.S 62.500
P. unitario
Bs.S 863
Venta
COMPLETED
31/07/26, 08:47 p. m.
Cantidad
81.12 USDT
Total Bs.S
Bs.S 70.000
P. unitario
Bs.S 863
Venta
COMPLETED
31/07/26, 08:45 p. m.
Cantidad
100.06 USDT
Total Bs.S
Bs.S 86.342
P. unitario
Bs.S 863
Venta
COMPLETED
31/07/26, 08:45 p. m.
Cantidad
100.35 USDT
Total Bs.S
Bs.S 86.600
P. unitario
Bs.S 863
Venta
COMPLETED
31/07/26, 08:44 p. m.
Cantidad
150.42 USDT
Total Bs.S
Bs.S 129.500
P. unitario
Bs.S 861
Venta
COMPLETED
31/07/26, 07:33 p. m.
Cantidad
70.14 USDT
Total Bs.S
Bs.S 60.250
P. unitario
Bs.S 859
Venta
COMPLETED
31/07/26, 07:33 p. m.
Cantidad
76.19 USDT
Total Bs.S
Bs.S 65.450
P. unitario
Bs.S 859
Venta
COMPLETED
31/07/26, 07:20 p. m.
Cantidad
64.02 USDT
Total Bs.S
Bs.S 55.000
P. unitario
Bs.S 859
Venta
CANCELLED_BY_SYSTEM
31/07/26, 07:17 p. m.
Cantidad
117.93 USDT
Total Bs.S
Bs.S 101.184
P. unitario
Bs.S 858
Venta
COMPLETED
31/07/26, 07:17 p. m.
Cantidad
93.24 USDT
Total Bs.S
Bs.S 80.000
P. unitario
Bs.S 858
Venta
COMPLETED
31/07/26, 07:16 p. m.
Cantidad
69.93 USDT
Total Bs.S
Bs.S 60.000
P. unitario
Bs.S 858
Venta
COMPLETED
31/07/26, 07:14 p. m.
Cantidad
61.06 USDT
Total Bs.S
Bs.S 52.389
P. unitario
Bs.S 858
Venta
COMPLETED
31/07/26, 07:10 p. m.
Cantidad
103.72 USDT
Total Bs.S
Bs.S 89.000
P. unitario
Bs.S 858
Venta
COMPLETED
31/07/26, 07:04 p. m.
Cantidad
74.59 USDT
Total Bs.S
Bs.S 64.000
P. unitario
Bs.S 858
Venta
COMPLETED
31/07/26, 07:01 p. m.
Cantidad
69.93 USDT
Total Bs.S
Bs.S 60.000
P. unitario
Bs.S 858
Venta
COMPLETED
31/07/26, 06:38 p. m.
Cantidad
465.98 USDT
Total Bs.S
Bs.S 400.000
P. unitario
Bs.S 858
Venta
COMPLETED
31/07/26, 06:35 p. m.
Cantidad
58.24 USDT
Total Bs.S
Bs.S 50.000
P. unitario
Bs.S 858
Venta
COMPLETED
31/07/26, 06:23 p. m.
Cantidad
63.09 USDT
Total Bs.S
Bs.S 54.000
P. unitario
Bs.S 856
Venta
COMPLETED
31/07/26, 06:21 p. m.
Cantidad
58.41 USDT
Total Bs.S
Bs.S 50.000
P. unitario
Bs.S 856
Venta
COMPLETED
31/07/26, 06:19 p. m.
Cantidad
72.43 USDT
Total Bs.S
Bs.S 62.000
P. unitario
Bs.S 856
Venta
COMPLETED
31/07/26, 06:13 p. m.
Cantidad
64.25 USDT
Total Bs.S
Bs.S 55.000
P. unitario
Bs.S 856
Venta
CANCELLED_BY_SYSTEM
31/07/26, 06:08 p. m.
Cantidad
233.67 USDT
Total Bs.S
Bs.S 200.000
P. unitario
Bs.S 856
Venta
COMPLETED
31/07/26, 06:08 p. m.
Cantidad
100.20 USDT
Total Bs.S
Bs.S 85.761
P. unitario
Bs.S 856
Venta
COMPLETED
31/07/26, 05:56 p. m.
Cantidad
175.35 USDT
Total Bs.S
Bs.S 150.257
P. unitario
Bs.S 857
Venta
COMPLETED
31/07/26, 05:44 p. m.
Cantidad
70.14 USDT
Total Bs.S
Bs.S 60.103
P. unitario
Bs.S 857
Venta
COMPLETED
31/07/26, 05:31 p. m.
Cantidad
101.52 USDT
Total Bs.S
Bs.S 87.000
P. unitario
Bs.S 857
Venta
COMPLETED
31/07/26, 05:11 p. m.
Cantidad
116.69 USDT
Total Bs.S
Bs.S 100.000
P. unitario
Bs.S 857
Venta
COMPLETED
31/07/26, 05:00 p. m.
Cantidad
1177.85 USDT
Total Bs.S
Bs.S 1.000.000
P. unitario
Bs.S 849
Venta
COMPLETED
31/07/26, 04:46 p. m.
Cantidad
116.83 USDT
Total Bs.S
Bs.S 100.000
P. unitario
Bs.S 856
Venta
COMPLETED
31/07/26, 04:45 p. m.
Cantidad
69.13 USDT
Total Bs.S
Bs.S 59.168
P. unitario
Bs.S 856
Venta
COMPLETED
31/07/26, 04:45 p. m.
Cantidad
58.41 USDT
Total Bs.S
Bs.S 50.000
P. unitario
Bs.S 856
Venta
COMPLETED
31/07/26, 04:45 p. m.
Cantidad
78.86 USDT
Total Bs.S
Bs.S 67.500
P. unitario
Bs.S 856
Venta
COMPLETED
31/07/26, 04:45 p. m.
Cantidad
80.16 USDT
Total Bs.S
Bs.S 68.609
P. unitario
Bs.S 856
Venta
COMPLETED
31/07/26, 04:43 p. m.
Cantidad
98.84 USDT
Total Bs.S
Bs.S 84.600
P. unitario
Bs.S 856
Venta
COMPLETED
31/07/26, 04:36 p. m.
Cantidad
80.16 USDT
Total Bs.S
Bs.S 68.609
P. unitario
Bs.S 856
Venta
COMPLETED
31/07/26, 04:35 p. m.
Cantidad
81.78 USDT
Total Bs.S
Bs.S 70.000
P. unitario
Bs.S 856
Venta
COMPLETED
31/07/26, 04:33 p. m.
Cantidad
116.83 USDT
Total Bs.S
Bs.S 100.000
P. unitario
Bs.S 856
Venta
CANCELLED_BY_SYSTEM
31/07/26, 04:33 p. m.
Cantidad
59.58 USDT
Total Bs.S
Bs.S 51.000
P. unitario
Bs.S 856
Venta
COMPLETED
31/07/26, 04:20 p. m.
Cantidad
150.30 USDT
Total Bs.S
Bs.S 128.642
P. unitario
Bs.S 856
Venta
COMPLETED
31/07/26, 04:07 p. m.
Cantidad
245.35 USDT
Total Bs.S
Bs.S 210.000
P. unitario
Bs.S 856
Venta
CANCELLED
31/07/26, 04:03 p. m.
Cantidad
80.06 USDT
Total Bs.S
Bs.S 68.523
P. unitario
Bs.S 856
Venta
COMPLETED
31/07/26, 04:01 p. m.
Cantidad
70.11 USDT
Total Bs.S
Bs.S 60.000
P. unitario
Bs.S 856
Venta
COMPLETED
31/07/26, 03:59 p. m.
Cantidad
70.11 USDT
Total Bs.S
Bs.S 60.000
P. unitario
Bs.S 856
Venta
COMPLETED
31/07/26, 03:58 p. m.
Cantidad
100.73 USDT
Total Bs.S
Bs.S 86.200
P. unitario
Bs.S 856
Venta
COMPLETED
31/07/26, 03:47 p. m.
Cantidad
70.34 USDT
Total Bs.S
Bs.S 60.000
P. unitario
Bs.S 853
Venta
COMPLETED
31/07/26, 03:46 p. m.
Cantidad
100.20 USDT
Total Bs.S
Bs.S 85.461
P. unitario
Bs.S 853
Venta
COMPLETED
31/07/26, 03:46 p. m.
Cantidad
87.53 USDT
Total Bs.S
Bs.S 74.662
P. unitario
Bs.S 853
Venta
COMPLETED
31/07/26, 03:45 p. m.
Cantidad
73.86 USDT
Total Bs.S
Bs.S 63.000
P. unitario
Bs.S 853
Venta
COMPLETED
31/07/26, 03:43 p. m.
Cantidad
70.34 USDT
Total Bs.S
Bs.S 60.000
P. unitario
Bs.S 853
Venta
COMPLETED
31/07/26, 03:39 p. m.
Cantidad
93.79 USDT
Total Bs.S
Bs.S 80.000
P. unitario
Bs.S 853
Venta
CANCELLED
31/07/26, 03:38 p. m.
Cantidad
70.34 USDT
Total Bs.S
Bs.S 60.000
P. unitario
Bs.S 853
Venta
COMPLETED
31/07/26, 03:37 p. m.
Cantidad
60.96 USDT
Total Bs.S
Bs.S 52.000
P. unitario
Bs.S 853
Venta
COMPLETED
31/07/26, 03:29 p. m.
Cantidad
440.06 USDT
Total Bs.S
Bs.S 375.327
P. unitario
Bs.S 853
Venta
COMPLETED
31/07/26, 03:18 p. m.
Cantidad
70.36 USDT
Total Bs.S
Bs.S 60.000
P. unitario
Bs.S 853
Venta
COMPLETED
31/07/26, 03:18 p. m.
Cantidad
113.75 USDT
Total Bs.S
Bs.S 97.000
P. unitario
Bs.S 853
Venta
COMPLETED
31/07/26, 03:18 p. m.
Cantidad
100.20 USDT
Total Bs.S
Bs.S 85.441
P. unitario
Bs.S 853
Venta
COMPLETED
31/07/26, 03:15 p. m.
Cantidad
70.36 USDT
Total Bs.S
Bs.S 60.000
P. unitario
Bs.S 853
Venta
COMPLETED
31/07/26, 03:13 p. m.
Cantidad
70.14 USDT
Total Bs.S
Bs.S 59.808
P. unitario
Bs.S 853
Venta
COMPLETED
31/07/26, 03:11 p. m.
Cantidad
100.26 USDT
Total Bs.S
Bs.S 85.500
P. unitario
Bs.S 853
Venta
COMPLETED
31/07/26, 03:11 p. m.
Cantidad
280.91 USDT
Total Bs.S
Bs.S 239.538
P. unitario
Bs.S 853
Venta
COMPLETED
31/07/26, 03:05 p. m.
Cantidad
2362.66 USDT
Total Bs.S
Bs.S 2.000.000
P. unitario
Bs.S 847
Venta
COMPLETED
31/07/26, 03:05 p. m.
Cantidad
125.06 USDT
Total Bs.S
Bs.S 106.664
P. unitario
Bs.S 853
Venta
CANCELLED
31/07/26, 03:05 p. m.
Cantidad
100.20 USDT
Total Bs.S
Bs.S 85.461
P. unitario
Bs.S 853
Venta
COMPLETED
31/07/26, 02:55 p. m.
Cantidad
81.98 USDT
Total Bs.S
Bs.S 70.000
P. unitario
Bs.S 854
Venta
CANCELLED
31/07/26, 02:52 p. m.
Cantidad
58.56 USDT
Total Bs.S
Bs.S 50.000
P. unitario
Bs.S 854
Venta
COMPLETED
31/07/26, 02:43 p. m.
Cantidad
58.44 USDT
Total Bs.S
Bs.S 50.000
P. unitario
Bs.S 856
Venta
COMPLETED
31/07/26, 02:41 p. m.
Cantidad
99.94 USDT
Total Bs.S
Bs.S 85.500
P. unitario
Bs.S 856
Venta
COMPLETED
31/07/26, 02:37 p. m.
Cantidad
65.06 USDT
Total Bs.S
Bs.S 55.659
P. unitario
Bs.S 856
Venta
COMPLETED
31/07/26, 02:36 p. m.
Cantidad
59.28 USDT
Total Bs.S
Bs.S 50.720
P. unitario
Bs.S 856
Venta
COMPLETED
31/07/26, 02:36 p. m.
Cantidad
100.20 USDT
Total Bs.S
Bs.S 85.721
P. unitario
Bs.S 856
Venta
COMPLETED
31/07/26, 02:35 p. m.
Cantidad
58.44 USDT
Total Bs.S
Bs.S 50.000
P. unitario
Bs.S 856
Venta
COMPLETED
31/07/26, 02:30 p. m.
Cantidad
75.06 USDT
Total Bs.S
Bs.S 64.214
P. unitario
Bs.S 856
Venta
COMPLETED
31/07/26, 02:27 p. m.
Cantidad
165.95 USDT
Total Bs.S
Bs.S 141.970
P. unitario
Bs.S 856
Venta
COMPLETED
31/07/26, 02:10 p. m.
Cantidad
175.33 USDT
Total Bs.S
Bs.S 150.000
P. unitario
Bs.S 856
Venta
COMPLETED
31/07/26, 02:07 p. m.
Cantidad
75.97 USDT
Total Bs.S
Bs.S 65.000
P. unitario
Bs.S 856
Venta
COMPLETED
31/07/26, 02:07 p. m.
Cantidad
80.65 USDT
Total Bs.S
Bs.S 69.000
P. unitario
Bs.S 856
Venta
COMPLETED
31/07/26, 02:07 p. m.
Cantidad
100.52 USDT
Total Bs.S
Bs.S 86.000
P. unitario
Bs.S 856
Venta
COMPLETED
31/07/26, 02:04 p. m.
Cantidad
81.82 USDT
Total Bs.S
Bs.S 70.000
P. unitario
Bs.S 856
Venta
COMPLETED
31/07/26, 01:53 p. m.
Cantidad
58.34 USDT
Total Bs.S
Bs.S 50.000
P. unitario
Bs.S 857
Venta
COMPLETED
31/07/26, 01:52 p. m.
Cantidad
227.79 USDT
Total Bs.S
Bs.S 195.200
P. unitario
Bs.S 857
Venta
COMPLETED
31/07/26, 01:51 p. m.
Cantidad
116.69 USDT
Total Bs.S
Bs.S 100.000
P. unitario
Bs.S 857
'''

RAW = RAW + SALES_31

def parse_bs(s: str) -> float:
    s = s.strip()
    parts = s.split('.')
    if len(parts) == 1:
        return float(parts[0])
    if len(parts[-1]) == 3:
        return float(''.join(parts))
    return float(''.join(parts[:-1]) + '.' + parts[-1])

pat = re.compile(
    r'(Compra|Venta)\s*\n'
    r'(COMPLETED|BUYER_PAYED|CANCELLED(?:_BY_SYSTEM)?)\s*\n'
    r'(\d{2}/\d{2}/\d{2}),[^\n]*\n'
    r'Cantidad\s*\n'
    r'([\d.]+)\s*USDT\s*\n'
    r'Total Bs\.S\s*\n'
    r'Bs\.S\s*([\d.]+)',
    re.MULTILINE,
)

rows = []
for m in pat.finditer(RAW):
    typ, status, date, usdt, total = m.groups()
    rows.append({
        'type': typ, 'status': status, 'date': date,
        'usdt': float(usdt), 'total': parse_bs(total),
    })

print(f'Total parseadas: {len(rows)}')
from collections import Counter
print('Estados:', dict(Counter(r['status'] for r in rows)))
print('Tipos COMPLETED:', dict(Counter(r['type'] for r in rows if r['status']=='COMPLETED')))

ok = [r for r in rows if r['status']=='COMPLETED']
pending = [r for r in rows if r['status']=='BUYER_PAYED']

by_day = defaultdict(lambda: {'buy_u':0,'buy_bs':0,'buy_n':0,'sell_u':0,'sell_bs':0,'sell_n':0})
bu=bbs=su=sbs=0.0
nb=ns=0
for r in ok:
    d=by_day[r['date']]
    if r['type']=='Compra':
        d['buy_u']+=r['usdt']; d['buy_bs']+=r['total']; d['buy_n']+=1
        bu+=r['usdt']; bbs+=r['total']; nb+=1
    else:
        d['sell_u']+=r['usdt']; d['sell_bs']+=r['total']; d['sell_n']+=1
        su+=r['usdt']; sbs+=r['total']; ns+=1

def fmt(n): return f'{n:,.0f}'.replace(',', '.')

print('\n=== POR DIA (COMPLETED) ===')
for d in sorted(by_day.keys(), key=lambda x: (x[6:8], x[3:5], x[0:2])):
    x=by_day[d]
    print(f"{d}: C {x['buy_n']:3d} {x['buy_u']:10.2f} USDT Bs {fmt(x['buy_bs']):>12} | V {x['sell_n']:3d} {x['sell_u']:10.2f} USDT Bs {fmt(x['sell_bs']):>12} | neto {x['buy_u']-x['sell_u']:+.2f}")

print('\n=== TOTAL COMPLETED (31 jul – 3 ago) ===')
print(f'Compras: {nb} | {bu:.2f} USDT | Bs {fmt(bbs)} | media {bbs/bu:.2f}')
print(f'Ventas:  {ns} | {su:.2f} USDT | Bs {fmt(sbs)} | media {sbs/su:.2f}')
net = bu - su
print(f'Neto USDT (compras-ventas): {net:+.2f}')
if net < 0:
    print(f'FALTA POR COMPRAR: {abs(net):.2f} USDT')
else:
    print(f'SOBRANTE (compraste de mas): {net:.2f} USDT')

matched = min(bu, su)
spread = (sbs/su) - (bbs/bu)
profit = matched * spread
print(f'\nSpread: {spread:.2f} Bs/USDT')
print(f'Ganancia est. matched: Bs {fmt(profit)} (~{profit/(bbs/bu):.2f} USDT) ROI {100*profit/(matched*(bbs/bu)):.2f}%')
print(f'Neto Bs (recibidos-pagados): {sbs-bbs:+,.0f}'.replace(',','.'))

pend_u = sum(r['usdt'] for r in pending)
pend_bs = sum(r['total'] for r in pending)
print(f'\nBUYER_PAYED: {len(pending)} ops | {pend_u:.2f} USDT | Bs {fmt(pend_bs)}')
if net < 0:
    print(f'Si se completan, falta quedaría: {abs(net)-pend_u:.2f} USDT')
else:
    print(f'Si se completan, sobrante quedaría: {net+pend_u:.2f} USDT')
