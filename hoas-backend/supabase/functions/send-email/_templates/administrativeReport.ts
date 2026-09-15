// 20. ADMINISTRATIVE REPORT

import { createEmailLayout, renderGreeting, renderParagraph, renderDivider, renderInfoCard, renderKPIBlock, renderButton } from '../_components/EmailLayout.ts'

interface AdministrativeReportData {
  adminName: string
  collegeName: string
  reportPeriod: string
  studentCount: number
  complaintCount: number
  resolvedComplaints: number
  leaveRequests: number
  reportUrl: string
}

export function renderAdministrativeReport(config: { appUrl: string; supportEmail: string; logoUrl: string; brandName: string }, data: AdministrativeReportData): string {
  const statusColors: Record<string, string> = {
    open: '#f59e0b',
    resolved: '#10b981',
  }

  const statusLabels: Record<string, string> = {
    open: 'Open',
    resolved: 'Resolved',
  }

  const kpiData = [
    { label: 'Students', value: data.studentCount },
    { label: 'Complaints', value: data.complaintCount },
    { label: 'Resolved', value: data.resolvedComplaints },
    { label: 'Requests', value: data.leaveRequests },
  ]

  const content = `
    ${renderGreeting(data.adminName)}
    ${renderParagraph(`Your HOAS ${data.reportPeriod} report for <strong>${data.collegeName}</strong> is ready.`)}
    ${renderDivider()}
    ${renderKPIBlock(kpiData)}
    ${renderDivider()}
    ${renderInfoCard('Report Summary', [
      { label: 'College', value: data.collegeName },
      { label: 'Report Period', value: data.reportPeriod },
    ])}
    ${renderButton(data.reportUrl, 'View Report')}
  `

  return createEmailLayout(config, content, `HOAS ${data.reportPeriod} report is ready`)
}