import { login } from './actions'

export default async function LoginPage({
    searchParams,
}: {
    searchParams: Promise<{ error?: string }>
}) {
    const params = await searchParams;

    return (
        <div className="flex h-100 w-full items-center justify-center bg-zinc-50">
            <div className="w-full max-w-md p-8 bg-white rounded-xl shadow-md border border-zinc-200">
                <h2 className="text-2xl font-bold text-center mb-6">Admin Login</h2>

                <form action={login} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1" htmlFor="email">Email</label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            required
                            className="w-full px-3 py-2 border rounded-md"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1" htmlFor="password">Password</label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            required
                            className="w-full px-3 py-2 border rounded-md"
                        />
                    </div>

                    {params?.error && (
                        <div className="text-sm text-red-600 bg-red-50 border border-red-200 p-3 rounded-md">
                            {params.error}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="w-full bg-zinc-900 text-white py-2 rounded-md hover:bg-zinc-800 transition-colors font-medium mt-4"
                    >
                        Sign In
                    </button>
                </form>
            </div>
        </div>
    )
}