# UI/UX Specification

This is the UI/UX specification for the spec detailed in @.agent-os/specs/2025-09-18-user-settings-design/spec.md

> Created: 2025-09-18
> Version: 1.0.0

## Design Principles

### Austrian Medical Software Standards
- **Professional Appearance**: Clean, clinical interface appropriate for healthcare settings
- **Regulatory Compliance**: Visual indicators for Austrian tax and professional requirements
- **Trust & Security**: Clear data protection messaging and secure interaction patterns
- **Accessibility**: WCAG 2.1 AA compliance for inclusive healthcare access

### User Experience Philosophy
- **Progressive Disclosure**: Complex settings revealed gradually to prevent overwhelm
- **Contextual Help**: Austrian-specific guidance embedded throughout the interface
- **Error Prevention**: Validation and guidance to prevent compliance violations
- **Mobile-First**: Responsive design optimized for on-the-go practice management

## Interface Architecture

### Navigation Structure
```
Settings Dashboard
├── Overview Tab (Profile Completion & Quick Actions)
├── Professional Profile
│   ├── Business Information
│   ├── Credentials & Qualifications
│   └── Public Page Configuration
├── Austrian Compliance
│   ├── VAT Registration & Status
│   ├── Kleinunternehmer Tracking
│   └── Legal Notices Configuration
├── Travel & Location
│   ├── Base Location Setup
│   ├── Transport Configuration
│   └── Service Radius Management
├── Services & Pricing
│   ├── Rate Templates
│   ├── Therapy Categories
│   └── Package Deals
├── System Preferences
│   ├── Language & Localization
│   ├── Notifications & Alerts
│   └── Date/Currency Formats
└── Integration & Export
    ├── Accounting Software Setup
    ├── Data Export Configuration
    └── API Connections
```

### Layout Design

#### Main Settings Container
```tsx
<div className="max-w-6xl mx-auto p-6 space-y-6">
  {/* Progress Header */}
  <SettingsProgressHeader />

  {/* Tabbed Navigation */}
  <SettingsNavigation activeTab={activeTab} />

  {/* Content Area */}
  <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
    {/* Main Content (3/4 width on desktop) */}
    <div className="lg:col-span-3">
      <SettingsTabContent tab={activeTab} />
    </div>

    {/* Sidebar (1/4 width on desktop) */}
    <div className="lg:col-span-1">
      <SettingsSidebar tab={activeTab} />
    </div>
  </div>
</div>
```

## Detailed Interface Specifications

### 1. Settings Overview Dashboard

#### Progress Tracking Card
```tsx
<Card className="bg-gradient-to-r from-blue-50 to-green-50 border-2">
  <CardHeader>
    <h2 className="text-xl font-semibold text-gray-900">
      Profil-Vollständigkeit
    </h2>
    <p className="text-sm text-gray-600">
      Vervollständigen Sie Ihr Profil für optimale Nutzung
    </p>
  </CardHeader>
  <CardContent>
    {/* Circular Progress Ring */}
    <div className="flex items-center space-x-4">
      <CircularProgress value={75} size="lg" />
      <div>
        <p className="text-2xl font-bold text-gray-900">75%</p>
        <p className="text-sm text-gray-600">Vollständig</p>
      </div>
    </div>

    {/* Missing Items List */}
    <div className="mt-4 space-y-2">
      <MissingSettingItem
        icon={MapPin}
        title="Standort-Einstellungen"
        description="Basis-Adresse für Reiseberechnungen"
        action={() => navigateToTab('travel')}
      />
      <MissingSettingItem
        icon={Calculator}
        title="Steuerstatus"
        description="Kleinunternehmer-Status konfigurieren"
        action={() => navigateToTab('compliance')}
      />
    </div>
  </CardContent>
</Card>
```

#### Quick Actions Grid
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  <QuickActionCard
    icon={User}
    title="Profil bearbeiten"
    description="Geschäftsdaten aktualisieren"
    href="/settings?tab=profile"
  />
  <QuickActionCard
    icon={Euro}
    title="Preise anpassen"
    description="Behandlungspreise verwalten"
    href="/settings?tab=pricing"
  />
  <QuickActionCard
    icon={Download}
    title="Daten exportieren"
    description="BMD/RZL Export erstellen"
    href="/settings?tab=export"
  />
</div>
```

### 2. Professional Profile Settings

#### Business Information Form
```tsx
<Form>
  {/* Business Basics */}
  <FormSection title="Geschäftsinformationen">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <FormField
        label="Praxisname *"
        name="businessName"
        placeholder="Dr. Sarah Müller - Physiotherapie"
        helperText="Offizieller Name für Rechnungen und Schriftverkehr"
      />
      <FormField
        label="Rechtsform"
        name="businessType"
        type="select"
        options={austrianBusinessTypes}
        helperText="Einzelunternehmen, GmbH, etc."
      />
    </div>

    {/* Austrian Address with Validation */}
    <AddressForm
      countryCode="AT"
      validatePostalCode={true}
      showCoordinates={false}
      label="Geschäftsadresse"
    />

    {/* Austrian Business Registration */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <FormField
        label="Firmenbuchnummer"
        name="businessRegistrationNumber"
        placeholder="FN 123456a"
        pattern="^FN \d+[a-z]$"
        helperText="Optional für Einzelunternehmen"
      />
      <FormField
        label="UID-Nummer"
        name="vatNumber"
        placeholder="ATU12345678"
        pattern="^ATU\d{8}$"
        helperText="Für umsatzsteuerpflichtige Unternehmen"
      />
    </div>
  </FormSection>

  {/* Professional Credentials */}
  <FormSection title="Qualifikationen">
    <CredentialsManager
      therapistId={therapist.id}
      onUpdate={handleCredentialsUpdate}
    />
  </FormSection>
</Form>
```

#### Credentials Management Component
```tsx
<div className="space-y-4">
  {credentials.map((credential) => (
    <CredentialCard
      key={credential.id}
      credential={credential}
      onEdit={handleEdit}
      onDelete={handleDelete}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Badge variant="success">Aktiv</Badge>
          <span className="font-medium">{credential.type}</span>
        </div>
        <span className="text-sm text-gray-500">
          Gültig bis: {formatDate(credential.expirationDate)}
        </span>
      </div>
    </CredentialCard>
  ))}

  <Button
    variant="outline"
    onClick={() => setShowAddModal(true)}
    className="w-full"
  >
    <Plus className="w-4 h-4 mr-2" />
    Qualifikation hinzufügen
  </Button>
</div>
```

### 3. Austrian Tax Compliance Settings

#### VAT Status Configuration
```tsx
<Card className="border-2 border-orange-200 bg-orange-50">
  <CardHeader>
    <div className="flex items-center space-x-2">
      <AlertTriangle className="w-5 h-5 text-orange-600" />
      <h3 className="font-semibold text-orange-900">
        Österreichische Steuereinstellungen
      </h3>
    </div>
  </CardHeader>
  <CardContent className="space-y-4">
    {/* VAT Registration Toggle */}
    <div className="flex items-center justify-between p-4 bg-white rounded-lg border">
      <div>
        <h4 className="font-medium">Umsatzsteuerpflichtig</h4>
        <p className="text-sm text-gray-600">
          Reguläre Besteuerung mit 20% Umsatzsteuer
        </p>
      </div>
      <Switch
        checked={vatRegistered}
        onCheckedChange={handleVATToggle}
      />
    </div>

    {/* Kleinunternehmer Status */}
    <div className="flex items-center justify-between p-4 bg-white rounded-lg border">
      <div>
        <h4 className="font-medium">Kleinunternehmer-Regelung</h4>
        <p className="text-sm text-gray-600">
          Umsatzsteuerbefreiung bis €55.000 Jahresumsatz
        </p>
      </div>
      <Switch
        checked={kleinunternehmerStatus}
        onCheckedChange={handleKUToggle}
        disabled={vatRegistered}
      />
    </div>

    {/* Threshold Tracking */}
    {kleinunternehmerStatus && (
      <KleinunternehmerThresholdCard
        currentRevenue={currentYearRevenue}
        threshold={55000}
        progress={(currentRevenue / 55000) * 100}
      />
    )}
  </CardContent>
</Card>
```

#### Threshold Monitoring Widget
```tsx
<div className="p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border">
  <div className="flex items-center justify-between mb-3">
    <h4 className="font-medium text-gray-900">
      Kleinunternehmer-Grenze {new Date().getFullYear()}
    </h4>
    <Badge variant={getThresholdStatus(progress)}>
      {progress.toFixed(1)}%
    </Badge>
  </div>

  {/* Progress Bar */}
  <div className="space-y-2">
    <div className="flex justify-between text-sm">
      <span>€{currentRevenue.toLocaleString('de-AT')}</span>
      <span>€55.000</span>
    </div>
    <Progress
      value={progress}
      className={`h-2 ${getProgressColor(progress)}`}
    />
  </div>

  {/* Warning Messages */}
  {progress > 80 && (
    <Alert className="mt-3 border-amber-200 bg-amber-50">
      <AlertTriangle className="w-4 h-4 text-amber-600" />
      <AlertDescription className="text-amber-800">
        Sie nähern sich der Kleinunternehmer-Grenze.
        Bei Überschreitung wird automatisch die Umsatzsteuerpflicht aktiviert.
      </AlertDescription>
    </Alert>
  )}
</div>
```

### 4. Travel & Location Settings

#### Base Location Configuration
```tsx
<FormSection title="Praxis-Standort">
  <div className="space-y-4">
    {/* Address Input with Map Preview */}
    <AddressField
      label="Basis-Adresse *"
      value={baseAddress}
      onChange={handleAddressChange}
      showMap={true}
      mapHeight="200px"
      placeholder="Hauptstraße 123, 4020 Linz"
    />

    {/* Coordinate Display */}
    {coordinates && (
      <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
        Koordinaten: {coordinates.lat.toFixed(6)}, {coordinates.lng.toFixed(6)}
      </div>
    )}
  </div>
</FormSection>

{/* Transport Method Selection */}
<FormSection title="Transport-Methode">
  <RadioGroup value={transportMethod} onValueChange={setTransportMethod}>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      <TransportOption
        value="car"
        icon={Car}
        label="PKW"
        description="Standard-Fahrzeug für Hausbesuche"
        rateLabel="€/km"
      />
      <TransportOption
        value="public"
        icon={Bus}
        label="Öffentlich"
        description="Öffentliche Verkehrsmittel"
        rateLabel="€/Fahrt"
      />
    </div>
  </RadioGroup>
</FormSection>

{/* Service Radius with Visual Map */}
<FormSection title="Einsatzgebiet">
  <div className="space-y-4">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <FormField
        label="Maximale Entfernung (km)"
        name="maxDistance"
        type="number"
        min="1"
        max="100"
        value={maxDistance}
        onChange={handleDistanceChange}
      />
      <FormField
        label="Reise-Pufferzeit (Minuten)"
        name="bufferTime"
        type="number"
        min="0"
        max="60"
        value={bufferTime}
      />
    </div>

    {/* Interactive Map with Service Radius */}
    <ServiceRadiusMap
      center={coordinates}
      radius={maxDistance * 1000} // Convert to meters
      onRadiusChange={handleRadiusChange}
      className="h-64 rounded-lg border"
    />
  </div>
</FormSection>
```

### 5. Service Rates & Pricing

#### Rate Templates Manager
```tsx
<div className="space-y-6">
  {/* Existing Rate Templates */}
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {rateTemplates.map((template) => (
      <RateTemplateCard
        key={template.id}
        template={template}
        onEdit={handleEdit}
        onDuplicate={handleDuplicate}
        onDelete={handleDelete}
      >
        <div className="p-4 border rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium">{template.name}</h4>
            <Badge variant="secondary">{template.category}</Badge>
          </div>
          <div className="text-2xl font-bold text-green-600 mb-1">
            €{template.basePrice}
          </div>
          <div className="text-sm text-gray-600 mb-3">
            {template.duration} Minuten • {template.vatRate}% MwSt.
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-500">
              {template.travelIncluded ? 'Inkl. Anfahrt' : 'Zzgl. Anfahrt'}
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => handleEdit(template.id)}>
                  Bearbeiten
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleDuplicate(template.id)}>
                  Duplizieren
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleDelete(template.id)}
                  className="text-red-600"
                >
                  Löschen
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </RateTemplateCard>
    ))}

    {/* Add New Template Button */}
    <Button
      variant="dashed"
      className="h-48 flex flex-col items-center justify-center"
      onClick={() => setShowCreateModal(true)}
    >
      <Plus className="w-8 h-8 mb-2 text-gray-400" />
      <span>Neue Preisvorlage</span>
    </Button>
  </div>
</div>
```

#### Rate Template Creation Modal
```tsx
<Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
  <DialogContent className="max-w-2xl">
    <DialogHeader>
      <DialogTitle>Neue Preisvorlage erstellen</DialogTitle>
    </DialogHeader>

    <Form onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Basic Information */}
        <FormField
          label="Behandlungsname *"
          name="name"
          placeholder="Klassische Massage"
        />
        <FormField
          label="Kategorie"
          name="category"
          type="select"
          options={serviceCategories}
        />

        {/* Pricing */}
        <FormField
          label="Grundpreis (€) *"
          name="basePrice"
          type="number"
          step="0.01"
          min="0"
        />
        <FormField
          label="Dauer (Minuten) *"
          name="duration"
          type="number"
          min="15"
          max="180"
          step="15"
        />

        {/* Tax Configuration */}
        <FormField
          label="MwSt.-Satz (%)"
          name="vatRate"
          type="select"
          options={[
            { value: 0, label: "0% (Kleinunternehmer)" },
            { value: 10, label: "10% (ermäßigt)" },
            { value: 20, label: "20% (Regelsteuersatz)" }
          ]}
        />

        {/* Travel Options */}
        <div className="flex items-center space-x-2">
          <Checkbox
            id="travelIncluded"
            checked={travelIncluded}
            onCheckedChange={setTravelIncluded}
          />
          <label htmlFor="travelIncluded" className="text-sm">
            Anfahrtskosten inklusive
          </label>
        </div>
      </div>

      {/* Description */}
      <FormField
        label="Beschreibung"
        name="description"
        type="textarea"
        placeholder="Beschreibung der Behandlung für Kunden..."
        rows={3}
      />

      <DialogFooter>
        <Button variant="outline" onClick={() => setShowCreateModal(false)}>
          Abbrechen
        </Button>
        <Button type="submit">
          Vorlage erstellen
        </Button>
      </DialogFooter>
    </Form>
  </DialogContent>
</Dialog>
```

## Mobile Responsiveness

### Breakpoint Strategy
```css
/* Mobile First Approach */
.settings-container {
  @apply px-4 py-6;
}

/* Tablet (768px+) */
@media (min-width: 768px) {
  .settings-container {
    @apply px-6 py-8;
  }

  .settings-tabs {
    @apply flex-row overflow-x-auto;
  }
}

/* Desktop (1024px+) */
@media (min-width: 1024px) {
  .settings-container {
    @apply px-8 py-10 max-w-6xl mx-auto;
  }

  .settings-layout {
    @apply grid-cols-4 gap-8;
  }
}
```

### Mobile Navigation
```tsx
// Mobile: Collapsible tab navigation
<div className="md:hidden">
  <Select value={activeTab} onValueChange={setActiveTab}>
    <SelectTrigger className="w-full mb-4">
      <SelectValue placeholder="Einstellungsbereich wählen..." />
    </SelectTrigger>
    <SelectContent>
      {settingsTabs.map((tab) => (
        <SelectItem key={tab.id} value={tab.id}>
          <div className="flex items-center space-x-2">
            <tab.icon className="w-4 h-4" />
            <span>{tab.label}</span>
          </div>
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
</div>

// Desktop: Horizontal tab navigation
<div className="hidden md:block">
  <TabsList className="grid w-full grid-cols-6">
    {settingsTabs.map((tab) => (
      <TabsTrigger key={tab.id} value={tab.id}>
        <tab.icon className="w-4 h-4 mr-2" />
        {tab.label}
      </TabsTrigger>
    ))}
  </TabsList>
</div>
```

## Accessibility Features

### Keyboard Navigation
- **Tab Order**: Logical progression through form fields and actions
- **Focus Indicators**: Clear visual focus states for all interactive elements
- **Keyboard Shortcuts**: Common shortcuts for save (Ctrl+S), cancel (Esc)
- **Screen Reader**: Proper ARIA labels and descriptions for all form elements

### Visual Accessibility
- **High Contrast**: Austrian medical blue (#1B365D) meets WCAG contrast requirements
- **Text Scaling**: Supports browser zoom up to 200% without horizontal scrolling
- **Color Independence**: Information conveyed through icons and text, not color alone
- **Loading States**: Clear feedback for all async operations

### Austrian Language Support
- **Error Messages**: Professional German error messaging for all validation
- **Help Text**: Contextual Austrian business guidance throughout forms
- **Date/Currency**: Proper Austrian formatting (DD.MM.YYYY, €X.XXX,XX)
- **Legal Terminology**: Accurate Austrian tax and business law terminology