"""Module responsible for definition of client for HBase database"""
from typing import Iterable, List, Mapping, Tuple, Any

import happybase
from thriftpy.transport import TTransportException

from data_labeling.config import ConfigurationFile
from data_labeling.clients.utils import retry_on_connection_error


configuration = ConfigurationFile()
host = configuration.get('hbase', 'host', fallback='localhost')
port = configuration.getint('hbase', 'port', fallback=9090)
size = configuration.getint('hbase', 'connection_pool_size', fallback=10)
try:
    HBASE_CONNECTION_POOL = happybase.ConnectionPool(size, host=host, port=port)
except (TTransportException, BrokenPipeError):
    print('WARNING! Could not connect to HBase. Is it down?')


class HBaseClient(object):
    """Client for HBase

    How to use this client?
    -----------------------
    This is a wrapper for HappyBase Connection. Client uses HappyBase's Connection Pool, so don't worry about closing
    connection, etc. This client should do everything inside below methods.

    Example:

        >>> hbase_client = HBaseClient()
        >>> data = hbase_client.get('my_table_name', 'row_key')
        >>> ...

    """

    SCANS = 'scans'
    ORIGINAL_SLICES_TABLE = 'original_slices'
    CONVERTED_SLICES_TABLE = 'converted_slices'

    def __init__(self) -> None:
        """Initializer for client"""
        pass

    @staticmethod
    @retry_on_connection_error
    def get_all_keys(table_name: str, starts_with: str = None) -> Iterable[str]:
        """Fetch all keys for given table

        :param table_name: name of a table
        :param starts_with: prefix for keys
        :return: iterator for table keys
        """
        with HBASE_CONNECTION_POOL.connection() as connection:
            row_prefix = str.encode(starts_with) if starts_with else None
            table = connection.table(table_name)
            for key, _ in table.scan(row_prefix=row_prefix, filter=str.encode('KeyOnlyFilter()')):
                yield key.decode('utf-8')

    @staticmethod
    @retry_on_connection_error
    def get_all_rows(table_name: str, columns: List, starts_with: str = None) -> Iterable[Tuple[str, Any]]:
        """Fetch all rows for given table

        :param table_name: name of a table
        :param starts_with: prefix for keys
        :param columns: list of columns to fetch
        :return: iterator for table keys
        """
        with HBASE_CONNECTION_POOL.connection() as connection:
            row_prefix = str.encode(starts_with) if starts_with else None
            table = connection.table(table_name)
            for key, value in table.scan(row_prefix=row_prefix, columns=columns):
                yield key.decode('utf-8'), value

    @staticmethod
    @retry_on_connection_error
    def get(table_name: str, key: str, columns: List[str] = None) -> Mapping:
        """Fetch a single row from HBase table

        :param table_name: name of a table
        :param key: key representing a row
        :param columns: columns which should be loaded (by default all)
        :return: mapping returned by HBase
        """
        hbase_key = str.encode(key)
        with HBASE_CONNECTION_POOL.connection() as connection:
            table = connection.table(table_name)
            return table.row(hbase_key, columns=columns)

    @staticmethod
    @retry_on_connection_error
    def put(table_name: str, key: str, value: Any) -> None:
        """Add new entry into HBase table

        :param table_name: name of a table
        :param key: key under value should be stored
        :param value: value which should be stored
        """
        hbase_key = str.encode(key)
        with HBASE_CONNECTION_POOL.connection() as connection:
            table = connection.table(table_name)
            table.put(hbase_key, value)

    @staticmethod
    @retry_on_connection_error
    def check_if_exists(table_name: str, key: str) -> bool:
        """Scan database and check if given key exists

        :param table_name: name of a table
        :param key: HBase key
        :return: boolean information if such key exists or not
        """
        hbase_key = str.encode(key)
        with HBASE_CONNECTION_POOL.connection() as connection:
            table = connection.table(table_name)
            results = table.scan(row_start=hbase_key, row_stop=hbase_key,
                                 filter=str.encode('KeyOnlyFilter() AND FirstKeyOnlyFilter()'), limit=1)
            return next(results, None) is not None
