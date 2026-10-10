import json

entries = [
    {'no': 1, 'date': '2024-12-01', 'item': 'Star Decoration', 'cat': 'Parish & Church Feasts', 'type': 'EXPENSE', 'amount': 2380, 'evt': None, 'evt_name': None},
    {'no': 2, 'date': '2024-12-13', 'item': 'Copy & Print (Cake Mela)', 'cat': 'Event Expenses', 'type': 'EXPENSE', 'amount': 200, 'evt': 'evt_cake_2024', 'evt_name': 'Cake Mela 2024'},
    {'no': 3, 'date': '2024-12-13', 'item': 'Unit Registration', 'cat': 'Diocese & Forane Dues', 'type': 'EXPENSE', 'amount': 980, 'evt': None, 'evt_name': None},
    {'no': 4, 'date': '2024-12-20', 'item': 'Bill Book', 'cat': 'Administration', 'type': 'EXPENSE', 'amount': 306, 'evt': None, 'evt_name': None},
    {'no': 5, 'date': '2024-12-23', 'item': 'Cake Mela (Sales Collection)', 'cat': 'Fundraising & Mela', 'type': 'INCOME', 'amount': 11760, 'evt': 'evt_cake_2024', 'evt_name': 'Cake Mela 2024'},
    {'no': 6, 'date': '2025-04-10', 'item': 'Snacks for Sunday School students', 'cat': 'Sunday School & Catechism', 'type': 'EXPENSE', 'amount': 1523, 'evt': None, 'evt_name': None},
    {'no': 7, 'date': '2025-04-20', 'item': 'Holy Week (Decoration & Food)', 'cat': 'Parish & Church Feasts', 'type': 'EXPENSE', 'amount': 2003, 'evt': 'evt_holyweek_2025', 'evt_name': 'Holy Week 2025'},
    {'no': 8, 'date': '2025-04-21', 'item': 'Supplement', 'cat': 'Society Activities', 'type': 'EXPENSE', 'amount': 208, 'evt': None, 'evt_name': None},
    {'no': 9, 'date': '2025-04-23', 'item': 'Cleaning / Painting (Grotto)', 'cat': 'Parish Maintenance', 'type': 'EXPENSE', 'amount': 5852, 'evt': None, 'evt_name': None},
    {'no': 10, 'date': '2025-04-24', 'item': 'Fish (Grotto)', 'cat': 'Parish Maintenance', 'type': 'EXPENSE', 'amount': 2890, 'evt': None, 'evt_name': None},
    {'no': 11, 'date': '2025-05-03', 'item': 'Snacks for Holy communion students', 'cat': 'Sunday School & Catechism', 'type': 'EXPENSE', 'amount': 119, 'evt': None, 'evt_name': None},
    {'no': 12, 'date': '2025-05-21', 'item': 'Cleaning Side', 'cat': 'Parish Maintenance', 'type': 'EXPENSE', 'amount': 720, 'evt': None, 'evt_name': None},
    {'no': 13, 'date': '2025-05-27', 'item': 'Motor Rent (Cleaning)', 'cat': 'Equipment Rental', 'type': 'EXPENSE', 'amount': 230, 'evt': None, 'evt_name': None},
    {'no': 14, 'date': '2025-05-29', 'item': 'Gift (asst.vicar)', 'cat': 'Honorarium & Gifts', 'type': 'EXPENSE', 'amount': 199, 'evt': None, 'evt_name': None},
    {'no': 15, 'date': '2025-05-31', 'item': 'Bouquet', 'cat': 'Parish & Church Feasts', 'type': 'EXPENSE', 'amount': 400, 'evt': None, 'evt_name': None},
    {'no': 16, 'date': '2025-06-05', 'item': 'Farewell Gift (Sister)', 'cat': 'Honorarium & Gifts', 'type': 'EXPENSE', 'amount': 900, 'evt': None, 'evt_name': None},
    {'no': 17, 'date': '2025-07-02', 'item': 'Feast celebration (asst.vicar)', 'cat': 'Parish & Church Feasts', 'type': 'EXPENSE', 'amount': 1259, 'evt': None, 'evt_name': None},
    {'no': 18, 'date': '2025-07-28', 'item': 'Poster Making Competition', 'cat': 'Competitions & Youth Fest', 'type': 'EXPENSE', 'amount': 1500, 'evt': None, 'evt_name': None},
    {'no': 19, 'date': '2025-07-31', 'item': 'Registration (രചന മത്സരം)', 'cat': 'Competitions & Youth Fest', 'type': 'EXPENSE', 'amount': 570, 'evt': None, 'evt_name': None},
    {'no': 20, 'date': '2025-08-03', 'item': 'Min. Balance (Service charge)', 'cat': 'Bank Charges', 'type': 'EXPENSE', 'amount': 2000, 'evt': None, 'evt_name': None},
    {'no': 21, 'date': '2025-08-04', 'item': 'Vianney day', 'cat': 'Honorarium & Gifts', 'type': 'EXPENSE', 'amount': 900, 'evt': None, 'evt_name': None},
    {'no': 22, 'date': '2025-08-27', 'item': 'Football competition registration', 'cat': 'Sports & Youth Welfare', 'type': 'EXPENSE', 'amount': 1000, 'evt': None, 'evt_name': None},
    {'no': 23, 'date': '2025-08-30', 'item': 'Sunday School Onam', 'cat': 'Sunday School & Catechism', 'type': 'EXPENSE', 'amount': 1933, 'evt': None, 'evt_name': None},
    {'no': 24, 'date': '2025-08-31', 'item': 'Football practice (Turf booking)', 'cat': 'Sports & Youth Welfare', 'type': 'EXPENSE', 'amount': 600, 'evt': None, 'evt_name': None},
    {'no': 25, 'date': '2025-09-04', 'item': 'Payasam Mela (Collection & Sales)', 'cat': 'Fundraising & Mela', 'type': 'INCOME', 'amount': 31200, 'evt': 'evt_payasam_2025', 'evt_name': 'Payasam Mela 2025'},
    {'no': 25, 'date': '2025-09-04', 'item': 'Payasam Mela (Ingredients & Supplies)', 'cat': 'Event Expenses', 'type': 'EXPENSE', 'amount': 26040, 'evt': 'evt_payasam_2025', 'evt_name': 'Payasam Mela 2025'},
    {'no': 26, 'date': '2025-09-06', 'item': 'Football competition (Food)', 'cat': 'Sports & Youth Welfare', 'type': 'EXPENSE', 'amount': 2210, 'evt': None, 'evt_name': None},
    {'no': 27, 'date': '2025-09-29', 'item': 'Birthday Celebration & Gift (Vicar)', 'cat': 'Honorarium & Gifts', 'type': 'EXPENSE', 'amount': 3389, 'evt': None, 'evt_name': None},
    {'no': 28, 'date': '2025-09-30', 'item': 'Badminton shuttlecock', 'cat': 'Sports & Youth Welfare', 'type': 'EXPENSE', 'amount': 1100, 'evt': None, 'evt_name': None},
    {'no': 29, 'date': '2025-10-04', 'item': 'Birthday Celebration & Gift (ast.Vicar)', 'cat': 'Honorarium & Gifts', 'type': 'EXPENSE', 'amount': 2168, 'evt': None, 'evt_name': None},
    {'no': 30, 'date': '2025-10-17', 'item': 'SMYM Flag', 'cat': 'Society Assets & Flags', 'type': 'EXPENSE', 'amount': 250, 'evt': None, 'evt_name': None},
    {'no': 31, 'date': '2025-11-30', 'item': 'Supplement', 'cat': 'Society Activities', 'type': 'EXPENSE', 'amount': 3000, 'evt': None, 'evt_name': None},
    {'no': 32, 'date': '2025-12-01', 'item': 'Unit Registration', 'cat': 'Diocese & Forane Dues', 'type': 'EXPENSE', 'amount': 1160, 'evt': None, 'evt_name': None},
    {'no': 33, 'date': '2025-12-25', 'item': 'Christmas Carol (Donations & Collection)', 'cat': 'Carol & Celebrations', 'type': 'INCOME', 'amount': 10496, 'evt': 'evt_carol_2025', 'evt_name': 'Christmas Carol 2025'},
    {'no': 33, 'date': '2025-12-25', 'item': 'Christmas Carol (Band & Transport Expenses)', 'cat': 'Event Expenses', 'type': 'EXPENSE', 'amount': 14357, 'evt': 'evt_carol_2025', 'evt_name': 'Christmas Carol 2025'},
    {'no': 34, 'date': '2025-12-25', 'item': 'Cake Mela (Sales Revenue)', 'cat': 'Fundraising & Mela', 'type': 'INCOME', 'amount': 35325, 'evt': 'evt_cake_2025', 'evt_name': 'Cake Mela 2025'},
    {'no': 34, 'date': '2025-12-25', 'item': 'Cake Mela (Bakery & Packaging Cost)', 'cat': 'Event Expenses', 'type': 'EXPENSE', 'amount': 32534, 'evt': 'evt_cake_2025', 'evt_name': 'Cake Mela 2025'},
    {'no': 35, 'date': '2026-01-06', 'item': 'Crib Cleaning', 'cat': 'Parish Maintenance', 'type': 'EXPENSE', 'amount': 400, 'evt': None, 'evt_name': None},
    {'no': 36, 'date': '2026-02-12', 'item': 'Cleaning and refreshment', 'cat': 'Parish Maintenance', 'type': 'EXPENSE', 'amount': 740, 'evt': None, 'evt_name': None},
    {'no': 37, 'date': '2026-03-07', 'item': 'Womens Day', 'cat': 'Society Activities', 'type': 'EXPENSE', 'amount': 800, 'evt': None, 'evt_name': None},
    {'no': 38, 'date': '2026-03-20', 'item': 'Kurishinte Vazhi', 'cat': 'Liturgy & Spiritual', 'type': 'EXPENSE', 'amount': 200, 'evt': None, 'evt_name': None},
    {'no': 39, 'date': '2026-04-09', 'item': 'വിശ്വാസോത്സവം - refreshment', 'cat': 'Sunday School & Catechism', 'type': 'EXPENSE', 'amount': 400, 'evt': None, 'evt_name': None},
    {'no': 40, 'date': '2026-04-26', 'item': 'Football competition registration', 'cat': 'Sports & Youth Welfare', 'type': 'EXPENSE', 'amount': 850, 'evt': 'evt_football_2026', 'evt_name': 'Diocese Youth Football Tournament 2026'},
    {'no': 41, 'date': '2026-05-02', 'item': 'Football Jersey', 'cat': 'Sports & Youth Welfare', 'type': 'EXPENSE', 'amount': 6820, 'evt': 'evt_football_2026', 'evt_name': 'Diocese Youth Football Tournament 2026'},
    {'no': 42, 'date': '2026-06-28', 'item': 'Badminton & Football competition registration', 'cat': 'Sports & Youth Welfare', 'type': 'EXPENSE', 'amount': 1800, 'evt': None, 'evt_name': None},
    {'no': 43, 'date': '2026-07-02', 'item': 'St.Thomas Quiz and Prize Pool', 'cat': 'Competitions & Youth Fest', 'type': 'EXPENSE', 'amount': 150, 'evt': None, 'evt_name': None},
    {'no': 44, 'date': '2026-07-05', 'item': 'Social experiment', 'cat': 'Society Activities', 'type': 'EXPENSE', 'amount': 100, 'evt': None, 'evt_name': None},
    {'no': 45, 'date': '2026-07-12', 'item': 'Football competition registration', 'cat': 'Sports & Youth Welfare', 'type': 'EXPENSE', 'amount': 750, 'evt': None, 'evt_name': None},
    {'no': 46, 'date': '2026-07-17', 'item': 'Condolence Flowers', 'cat': 'Charity & Welfare', 'type': 'EXPENSE', 'amount': 400, 'evt': None, 'evt_name': None},
    {'no': 47, 'date': '2026-08-15', 'item': 'Quiz Competition Prize', 'cat': 'Competitions & Youth Fest', 'type': 'EXPENSE', 'amount': 1750, 'evt': None, 'evt_name': None},
    {'no': 48, 'date': '2026-09-04', 'item': 'Payasam Mela (Sales Collection)', 'cat': 'Fundraising & Mela', 'type': 'INCOME', 'amount': 25841, 'evt': 'evt_payasam_2026', 'evt_name': 'Payasam Mela 2026'},
    {'no': 48, 'date': '2026-09-04', 'item': 'Payasam Mela (Ingredients & Supplies)', 'cat': 'Event Expenses', 'type': 'EXPENSE', 'amount': 19948, 'evt': 'evt_payasam_2026', 'evt_name': 'Payasam Mela 2026'},
    {'no': 49, 'date': '2026-09-27', 'item': 'Gift For Students (Sunday School)', 'cat': 'Sunday School & Catechism', 'type': 'EXPENSE', 'amount': 850, 'evt': None, 'evt_name': None},
    {'no': 50, 'date': '2026-10-01', 'item': 'Peter (House)', 'cat': 'Charity & Welfare', 'type': 'EXPENSE', 'amount': 2000, 'evt': None, 'evt_name': None},
    {'no': 51, 'date': '2026-10-04', 'item': 'Birthday Cake (ast.Vicar)', 'cat': 'Honorarium & Gifts', 'type': 'EXPENSE', 'amount': 950, 'evt': None, 'evt_name': None}
]

# Generate src/services/mockData.ts
mock_ts = """import { Transaction, Account, Bill, EventItem, User, AuditLog } from '../types';

export const IS_DEMO_DATA = true;

export const MOCK_ACCOUNTS: Account[] = [
  {
    account_id: 'acc_01',
    account_name: 'Treasurer - Operating Account',
    account_type: 'BANK',
    opening_balance: 40000,
    current_balance: 1643,
    is_active: true,
  },
  {
    account_id: 'acc_02',
    account_name: 'Cash in Hand (Treasurer)',
    account_type: 'CASH',
    opening_balance: 0,
    current_balance: 300,
    is_active: true,
  },
  {
    account_id: 'acc_03',
    account_name: 'Cash in Hand (ast.Vicar)',
    account_type: 'CASH',
    opening_balance: 0,
    current_balance: 150,
    is_active: true,
  },
];

export const MOCK_EVENTS: EventItem[] = [
  {
    event_id: 'evt_cake_2024',
    event_name: 'Cake Mela 2024',
    event_date: '2024-12-23',
    budget: 15000,
    total_income: 11760,
    total_expense: 200,
    net_balance: 11560,
    status: 'COMPLETED',
    description: 'Parish Christmas Cake Mela sales & fundraising.',
  },
  {
    event_id: 'evt_holyweek_2025',
    event_name: 'Holy Week 2025',
    event_date: '2025-04-20',
    budget: 3000,
    total_income: 0,
    total_expense: 2003,
    net_balance: -2003,
    status: 'COMPLETED',
    description: 'Liturgy decoration and refreshments for Holy Week.',
  },
  {
    event_id: 'evt_payasam_2025',
    event_name: 'Payasam Mela 2025',
    event_date: '2025-09-04',
    budget: 25000,
    total_income: 31200,
    total_expense: 26040,
    net_balance: 5160,
    status: 'COMPLETED',
    description: 'Annual Onam Payasam Mela fundraising event.',
  },
  {
    event_id: 'evt_carol_2025',
    event_name: 'Christmas Carol 2025',
    event_date: '2025-12-25',
    budget: 15000,
    total_income: 10496,
    total_expense: 14357,
    net_balance: -3861,
    status: 'COMPLETED',
    description: 'Parish door-to-door Christmas carol rounds.',
  },
  {
    event_id: 'evt_cake_2025',
    event_name: 'Cake Mela 2025',
    event_date: '2025-12-25',
    budget: 35000,
    total_income: 35325,
    total_expense: 32534,
    net_balance: 2791,
    status: 'COMPLETED',
    description: 'Parish Christmas Cake Mela sales.',
  },
  {
    event_id: 'evt_football_2026',
    event_name: 'Diocese Youth Football Tournament 2026',
    event_date: '2026-04-26',
    budget: 10000,
    total_income: 0,
    total_expense: 7670,
    net_balance: -7670,
    status: 'COMPLETED',
    description: 'Team registration, tournament practice and player jersey set.',
  },
  {
    event_id: 'evt_payasam_2026',
    event_name: 'Payasam Mela 2026',
    event_date: '2026-09-04',
    budget: 20000,
    total_income: 25841,
    total_expense: 19948,
    net_balance: 5893,
    status: 'COMPLETED',
    description: 'Parish Onam season Payasam Mela stall.',
  },
];

export const MOCK_BILLS: Bill[] = [
  {
    bill_id: 'bill_01',
    bill_name: 'Custom Youth Football Jersey Printing',
    vendor: 'PrintCraft Apparels',
    amount: 6820,
    paid_amount: 6820,
    due_date: '2026-05-02',
    category: 'Sports & Youth Welfare',
    status: 'PAID',
    notes: 'Paid in full for tournament jersey kit.',
  },
  {
    bill_id: 'bill_02',
    bill_name: 'Grotto Cleaning Equipment & Painting',
    vendor: 'Parish Hardware & Paints',
    amount: 5852,
    paid_amount: 5852,
    due_date: '2025-04-23',
    category: 'Parish Maintenance',
    status: 'PAID',
    notes: 'Settled for church grotto maintenance.',
  },
];

export const MOCK_TRANSACTIONS: Transaction[] = [\n"""

for i, e in enumerate(entries):
    tid = f"txn_{i+1:02d}"
    evt_part = f"event_id: '{e['evt']}'," if e['evt'] else "event_id: undefined,"
    evt_name_part = f"event_name: '{e['evt_name']}'," if e['evt_name'] else "event_name: undefined,"
    desc = e['item'].replace("'", "\\'")
    mock_ts += f"""  {{
    transaction_id: '{tid}',
    date: '{e['date']}',
    type: '{e['type']}',
    description: '{desc}',
    category: '{e['cat']}',
    amount: {e['amount']},
    account_id: 'acc_01',
    account_name: 'Treasurer - Operating Account',
    payment_method: 'CASH',
    {evt_part}
    {evt_name_part}
    status: 'COMPLETED',
    created_by: 'treasurer@smym.org',
    created_at: '{e['date']}T10:00:00Z',
  }},\n"""

mock_ts += """];

export const MOCK_USERS: User[] = [
  {
    user_id: 'usr_01',
    email: 'admin@smym.org',
    display_name: 'Fr. Director / Treasurer',
    role: 'ADMIN',
    status: 'ACTIVE',
    created_at: '2024-12-01T00:00:00Z',
    updated_at: '2026-10-10T12:00:00Z',
  },
  {
    user_id: 'usr_02',
    email: 'editor@smym.org',
    display_name: 'Youth Secretary',
    role: 'EDITOR',
    status: 'ACTIVE',
    created_at: '2024-12-01T00:00:00Z',
    updated_at: '2026-10-10T12:00:00Z',
  },
  {
    user_id: 'usr_03',
    email: 'visitor@smym.org',
    display_name: 'Parish Member',
    role: 'PUBLIC_VIEWER',
    status: 'ACTIVE',
    created_at: '2024-12-01T00:00:00Z',
    updated_at: '2026-10-10T12:00:00Z',
  },
];

export const MOCK_AUDIT_LOGS: AuditLog[] = [
  {
    log_id: 'aud_01',
    timestamp: '2024-12-01T09:00:00Z',
    actor_email: 'admin@smym.org',
    action: 'CREATE',
    entity_type: 'TRANSACTION',
    entity_id: 'txn_01',
    details: 'Opening ledger setup for SMYM Arunapuram with ₹40,000 balance.',
  },
];
"""

with open('src/services/mockData.ts', 'w') as f:
    f.write(mock_ts)

print("Successfully written src/services/mockData.ts")
