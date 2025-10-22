<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Rapport Analytics Antigaspi</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            padding: 20px;
            background-color: #f5f5f5;
        }

        .container {
            max-width: 1200px;
            margin: 0 auto;
            background-color: white;
            padding: 40px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }

        .header {
            text-align: center;
            border-bottom: 3px solid #10B981;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }

        .header h1 {
            color: #10B981;
            font-size: 32px;
            margin-bottom: 10px;
        }

        .header .period {
            font-size: 18px;
            color: #666;
            margin: 10px 0;
        }

        .header .generated {
            font-size: 14px;
            color: #999;
        }

        .section {
            margin: 30px 0;
        }

        .section-title {
            font-size: 24px;
            color: #1F2937;
            border-left: 4px solid #10B981;
            padding-left: 15px;
            margin-bottom: 20px;
        }

        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }

        .stat-card {
            background-color: #F9FAFB;
            border-radius: 8px;
            padding: 20px;
            border-left: 4px solid #10B981;
        }

        .stat-card .label {
            font-size: 14px;
            color: #6B7280;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 5px;
        }

        .stat-card .value {
            font-size: 28px;
            font-weight: bold;
            color: #1F2937;
        }

        .environmental-impact {
            background: linear-gradient(135deg, #10B981 0%, #059669 100%);
            color: white;
            padding: 30px;
            border-radius: 10px;
            margin: 20px 0;
        }

        .environmental-impact h3 {
            font-size: 20px;
            margin-bottom: 15px;
        }

        .environmental-impact .impact-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
        }

        .environmental-impact .impact-item {
            background-color: rgba(255,255,255,0.1);
            padding: 15px;
            border-radius: 5px;
        }

        .environmental-impact .impact-item .value {
            font-size: 24px;
            font-weight: bold;
            margin-top: 5px;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }

        table thead {
            background-color: #10B981;
            color: white;
        }

        table th {
            padding: 12px;
            text-align: left;
            font-weight: 600;
        }

        table td {
            padding: 12px;
            border-bottom: 1px solid #E5E7EB;
        }

        table tbody tr:hover {
            background-color: #F9FAFB;
        }

        table tbody tr:nth-child(even) {
            background-color: #F9FAFB;
        }

        .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #E5E7EB;
            color: #6B7280;
            font-size: 14px;
        }

        .badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 600;
        }

        .badge-success {
            background-color: #D1FAE5;
            color: #065F46;
        }

        .badge-warning {
            background-color: #FEF3C7;
            color: #92400E;
        }

        @media print {
            body {
                background-color: white;
                padding: 0;
            }

            .container {
                box-shadow: none;
                padding: 20px;
            }

            table {
                page-break-inside: auto;
            }

            tr {
                page-break-inside: avoid;
                page-break-after: auto;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <div class="header">
            <h1>📊 Rapport Analytics Antigaspi</h1>
            <p class="period">
                <strong>Période :</strong> {{ $data['period']['start'] }} au {{ $data['period']['end'] }}
            </p>
            <p class="generated">Généré le {{ $generated_at }}</p>
        </div>

        <!-- Summary Statistics -->
        <div class="section">
            <h2 class="section-title">Statistiques Générales</h2>
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="label">Utilisateurs Total</div>
                    <div class="value">{{ number_format($data['summary']['total_users']) }}</div>
                </div>
                <div class="stat-card">
                    <div class="label">Consommateurs</div>
                    <div class="value">{{ number_format($data['summary']['consumers']) }}</div>
                </div>
                <div class="stat-card">
                    <div class="label">Commerçants</div>
                    <div class="value">{{ number_format($data['summary']['merchants']) }}</div>
                </div>
                <div class="stat-card">
                    <div class="label">Commerçants Vérifiés</div>
                    <div class="value">{{ number_format($data['summary']['verified_merchants']) }}</div>
                </div>
                <div class="stat-card">
                    <div class="label">Produits Total</div>
                    <div class="value">{{ number_format($data['summary']['total_products']) }}</div>
                </div>
                <div class="stat-card">
                    <div class="label">Produits Actifs</div>
                    <div class="value">{{ number_format($data['summary']['active_products']) }}</div>
                </div>
                <div class="stat-card">
                    <div class="label">Réservations Total</div>
                    <div class="value">{{ number_format($data['summary']['total_reservations']) }}</div>
                </div>
                <div class="stat-card">
                    <div class="label">Réservations Complétées</div>
                    <div class="value">{{ number_format($data['summary']['completed_reservations']) }}</div>
                </div>
                <div class="stat-card">
                    <div class="label">Revenu Total</div>
                    <div class="value">{{ $data['summary']['total_revenue'] }}</div>
                </div>
                <div class="stat-card">
                    <div class="label">Panier Moyen</div>
                    <div class="value">{{ $data['summary']['average_order_value'] }}</div>
                </div>
                <div class="stat-card">
                    <div class="label">Produits Sauvés</div>
                    <div class="value">{{ number_format($data['summary']['products_saved']) }}</div>
                </div>
            </div>
        </div>

        <!-- Environmental Impact -->
        <div class="environmental-impact">
            <h3>🌍 Impact Environnemental</h3>
            <div class="impact-grid">
                <div class="impact-item">
                    <div class="label">CO2 Économisé</div>
                    <div class="value">{{ $data['summary']['environmental_impact']['co2_saved'] }}</div>
                </div>
                <div class="impact-item">
                    <div class="label">Eau Économisée</div>
                    <div class="value">{{ $data['summary']['environmental_impact']['water_saved'] }}</div>
                </div>
            </div>
        </div>

        <!-- Top Merchants -->
        <div class="section">
            <h2 class="section-title">🏆 Top Commerçants</h2>
            @if(count($data['top_merchants']) > 0)
                <table>
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Nom</th>
                            <th>Type</th>
                            <th>Email</th>
                            <th>Commandes</th>
                            <th>Statut</th>
                        </tr>
                    </thead>
                    <tbody>
                        @foreach($data['top_merchants'] as $index => $merchant)
                            <tr>
                                <td>{{ $index + 1 }}</td>
                                <td><strong>{{ $merchant['name'] }}</strong></td>
                                <td>{{ $merchant['type'] }}</td>
                                <td>{{ $merchant['email'] }}</td>
                                <td>{{ $merchant['orders'] }}</td>
                                <td>
                                    @if($merchant['verified'] === 'Oui')
                                        <span class="badge badge-success">✓ Vérifié</span>
                                    @else
                                        <span class="badge badge-warning">⏳ En attente</span>
                                    @endif
                                </td>
                            </tr>
                        @endforeach
                    </tbody>
                </table>
            @else
                <p style="text-align: center; color: #6B7280; padding: 20px;">Aucun commerçant pour cette période</p>
            @endif
        </div>

        <!-- Popular Categories -->
        <div class="section">
            <h2 class="section-title">📦 Catégories Populaires</h2>
            @if(count($data['popular_categories']) > 0)
                <table>
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Nom</th>
                            <th>Icône</th>
                            <th>Nombre de Produits</th>
                        </tr>
                    </thead>
                    <tbody>
                        @foreach($data['popular_categories'] as $index => $category)
                            <tr>
                                <td>{{ $index + 1 }}</td>
                                <td><strong>{{ $category['name'] }}</strong></td>
                                <td>{{ $category['icon'] }}</td>
                                <td>{{ number_format($category['products_count']) }}</td>
                            </tr>
                        @endforeach
                    </tbody>
                </table>
            @else
                <p style="text-align: center; color: #6B7280; padding: 20px;">Aucune catégorie pour cette période</p>
            @endif
        </div>

        <!-- Footer -->
        <div class="footer">
            <p><strong>Antigaspi</strong> - Plateforme Anti-Gaspillage Alimentaire</p>
            <p>Luttons ensemble contre le gaspillage alimentaire 🌱</p>
        </div>
    </div>

    <script>
        // Auto-print when PDF export is requested
        if (window.location.search.includes('auto_print=true')) {
            window.onload = function() {
                window.print();
            };
        }
    </script>
</body>
</html>
