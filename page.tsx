import { getServerSession } from 'next-auth';
import { prisma } from '@myoflow/db';
import { createAuditLog } from '@myoflow/lib/src/audit/log';
import { encryptJson, decryptJson } from '@myoflow/lib/src/security/crypto';
import { redirect } from 'next/navigation';

async function getClients(therapistId: string) {
  const clients = await prisma.client.findMany({
    where: { therapistId },
    orderBy: { name: 'asc' },
  });

  // Log audit entry for reading clients list
  await createAuditLog({
    therapistId,
    entity: 'Client',
    entityId: 'list',
    action: 'READ',
    meta: { count: clients.length },
  });

  return clients;
}

export default async function ClientsPage() {
  const session = await getServerSession();
  
  if (!session?.user?.email) {
    redirect('/sign-in');
  }

  // TODO-CLAUDE: Get therapistId from session
  const therapistId = 'placeholder-therapist-id';
  
  const clients = await getClients(therapistId);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Clients</h1>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
          Add Client
        </button>
      </div>
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Phone
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tags
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {clients.map((client) => (
              <tr key={client.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {client.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {client.email || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {client.phone || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {client.tags.join(', ') || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button className="text-indigo-600 hover:text-indigo-900 mr-4">
                    Edit
                  </button>
                  <button className="text-red-600 hover:text-red-900">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {clients.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No clients found. Add your first client to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
}

