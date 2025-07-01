'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function DebugCompanyPage() {
  const [companyId, setCompanyId] = useState('')
  const [searchName, setSearchName] = useState('')
  const [debugData, setDebugData] = useState<any>(null)
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [searchLoading, setSearchLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSearch = async () => {
    if (!searchName.trim()) {
      setError('Please enter a company name')
      return
    }

    setSearchLoading(true)
    setError('')
    
    try {
      const response = await fetch(`/api/debug/find-company?name=${encodeURIComponent(searchName)}`)
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to search companies')
      }
      
      setSearchResults(data.companies)
    } catch (err: any) {
      setError(err.message)
      setSearchResults([])
    } finally {
      setSearchLoading(false)
    }
  }

  const debugCompany = async (idToUse: string) => {
    setLoading(true)
    setError('')
    
    try {
      const response = await fetch(`/api/debug/company-modules?companyId=${idToUse}`)
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch debug data')
      }
      
      setDebugData(data)
      setCompanyId(idToUse) // Update the ID field
    } catch (err: any) {
      setError(err.message)
      setDebugData(null)
    } finally {
      setLoading(false)
    }
  }

  const handleDebug = async () => {
    if (!companyId.trim()) {
      setError('Please enter a company ID')
      return
    }
    await debugCompany(companyId)
  }

  const handleDebugFromSearch = async (selectedCompanyId: string) => {
    await debugCompany(selectedCompanyId)
  }

  const handleFixTemplate = async () => {
    if (!debugData?.company?.template_id) {
      setError('No template ID found')
      return
    }

    setLoading(true)
    setError('')
    
    try {
      const response = await fetch('/api/debug/fix-template-modules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateId: debugData.company.template_id })
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fix template')
      }
      
      // Refresh debug data after fixing
      await debugCompany(debugData.companyId)
      alert(`Template fixed! Added ${result.requiredModules} modules.`)
      
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Debug Company Modules</h1>
        <p className="text-gray-600">Debug tool to investigate company module assignments</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Search by Company Name</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 mb-4">
              <Input
                type="text"
                placeholder="Enter company name (e.g., Inted)"
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                className="flex-1"
              />
              <Button onClick={handleSearch} disabled={searchLoading}>
                {searchLoading ? 'Searching...' : 'Search'}
              </Button>
            </div>
            {searchResults.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Found {searchResults.length} companies:</p>
                {searchResults.map((company: any) => (
                  <div key={company.id} className="border p-3 rounded flex justify-between items-center">
                    <div>
                      <p className="font-medium">{company.name}</p>
                      <p className="text-sm text-gray-600">
                        Template: {company.client_templates?.name || 'None'} | 
                        Status: {company.status} | 
                        Features: {company.features?.length || 0}
                      </p>
                    </div>
                    <Button 
                      size="sm" 
                      onClick={() => handleDebugFromSearch(company.id)}
                      disabled={loading}
                    >
                      Debug
                    </Button>
                  </div>
                ))}
              </div>
            )}
            {error && (
              <p className="text-red-600 mt-2">{error}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Direct Company ID Lookup</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="Enter company ID (UUID)"
                value={companyId}
                onChange={(e) => setCompanyId(e.target.value)}
                className="flex-1"
              />
              <Button onClick={handleDebug} disabled={loading}>
                {loading ? 'Loading...' : 'Debug'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {debugData && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Company Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p><strong>Name:</strong> {debugData.company.name}</p>
                  <p><strong>ID:</strong> {debugData.company.id}</p>
                  <p><strong>Template ID:</strong> {debugData.company.template_id || 'None'}</p>
                </div>
                <div>
                  <p><strong>Template Name:</strong> {debugData.company.template?.name || 'None'}</p>
                  <p><strong>Features:</strong> {debugData.company.features?.length || 0} items</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Badge variant={debugData.analysis.hasTemplate ? "default" : "secondary"}>
                    Has Template: {debugData.analysis.hasTemplate ? 'Yes' : 'No'}
                  </Badge>
                </div>
                <div>
                  <Badge variant={debugData.analysis.hasFeatures ? "default" : "secondary"}>
                    Has Features: {debugData.analysis.hasFeatures ? 'Yes' : 'No'}
                  </Badge>
                </div>
                <div>
                  <p><strong>Template Modules:</strong> {debugData.analysis.templateModulesCount}</p>
                </div>
                <div>
                  <p><strong>Actual Modules:</strong> {debugData.analysis.actualModulesCount}</p>
                </div>
                <div className="col-span-2">
                  <p><strong>Fallback Used:</strong> {debugData.analysis.fallbackUsed}</p>
                </div>
              </div>
              
              {/* Show fix button if template has fewer modules than available_features */}
              {debugData.company.template?.available_features?.length > debugData.analysis.templateModulesCount && (
                <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
                  <p className="text-sm text-yellow-800 mb-2">
                    <strong>⚠️ Template Issue Detected:</strong> Template has {debugData.company.template.available_features.length} available features 
                    but only {debugData.analysis.templateModulesCount} modules assigned in template_modules table.
                  </p>
                  <Button 
                    onClick={handleFixTemplate} 
                    disabled={loading}
                    className="bg-yellow-600 hover:bg-yellow-700"
                  >
                    {loading ? 'Fixing...' : 'Fix Template - Assign Missing Modules'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Company Features Array</CardTitle>
            </CardHeader>
            <CardContent>
              {debugData.company.features && debugData.company.features.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {debugData.company.features.map((feature: string, index: number) => (
                    <Badge key={index} variant="outline">{feature}</Badge>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No features array</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Template Available Features</CardTitle>
            </CardHeader>
            <CardContent>
              {debugData.company.template?.available_features?.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {debugData.company.template.available_features.map((feature: string, index: number) => (
                    <Badge key={index} variant="outline">{feature}</Badge>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No template features</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Template Modules (from template_modules table)</CardTitle>
            </CardHeader>
            <CardContent>
              {debugData.templateModules.length > 0 ? (
                <div className="space-y-2">
                  {debugData.templateModules.map((module: any, index: number) => (
                    <div key={index} className="border p-2 rounded">
                      <p><strong>{module.name}</strong></p>
                      <p className="text-sm text-gray-600">Route: {module.route_path}</p>
                      <p className="text-sm text-gray-600">Category: {module.category}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No modules in template_modules table</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Actual Modules Returned by getModulesForCompany()</CardTitle>
            </CardHeader>
            <CardContent>
              {debugData.actualModulesFromFunction.length > 0 ? (
                <div className="space-y-2">
                  {debugData.actualModulesFromFunction.map((module: any, index: number) => (
                    <div key={index} className="border p-2 rounded">
                      <p><strong>{module.name}</strong></p>
                      <p className="text-sm text-gray-600">Route: {module.route_path}</p>
                      <p className="text-sm text-gray-600">Category: {module.category}</p>
                      {module.featureId && (
                        <p className="text-sm text-blue-600">Feature ID: {module.featureId}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No modules returned</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
} 